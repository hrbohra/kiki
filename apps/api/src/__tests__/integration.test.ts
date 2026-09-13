// Integration tests against the real (seeded) database, exercising the tRPC surface through a
// hand-wired caller. AI runs offline here (GEMINI_API_KEY cleared) so results are deterministic.
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { WorldRepository } from '../world/world.repository';
import { WorldService } from '../world/world.service';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../auth/email.service';
import { IdempotencyService } from '../common/idempotency.service';
import { RequestsService } from '../writes/requests.service';
import { TripsService } from '../writes/trips.service';
import { GuestBookService } from '../writes/guestbook.service';
import { MessagingService } from '../messaging/messaging.service';
import { InMemoryMessageBus } from '../messaging/message-bus';
import { MediaService } from '../media/media.service';
import { LocalDiskStorage } from '../media/storage';
import { IntroService } from '../ai/intro.service';
import { PromptComposer } from '../ai/prompt-composer';
import { PromptInjectionVoiceProvider } from '../ai/voice.provider';
import { GeminiProvider } from '../ai/llm.provider';
import { appRouter } from '../trpc/app.router';
import type { Context } from '../trpc/trpc';
import type { SessionUser } from '../auth/auth.service';

// Force the AI fallback path (no live model) for deterministic assertions.
delete process.env.GEMINI_API_KEY;

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
}) as unknown as PrismaService;

function buildDeps() {
  const world = new WorldService(new WorldRepository(prisma));
  const auth = new AuthService(prisma, new EmailService());
  const idem = new IdempotencyService(prisma);
  const guestbook = new GuestBookService(prisma, idem, world);
  const messaging = new MessagingService(prisma, world, new InMemoryMessageBus());
  const media = new MediaService(prisma, world, new LocalDiskStorage('.uploads', 'http://localhost:4000'));
  const ai = new IntroService(prisma, world, new PromptComposer(new PromptInjectionVoiceProvider()), new GeminiProvider());
  return {
    world,
    auth,
    requests: new RequestsService(prisma, idem),
    trips: new TripsService(prisma, idem),
    guestbook,
    messaging,
    media,
    ai,
  };
}

const deps = buildDeps();
const caller = (user: SessionUser | null) => appRouter.createCaller({ ...deps, user } as Context);

beforeAll(async () => {
  await (prisma as unknown as PrismaClient).stayRequest.deleteMany({ where: { message: 'integration-marker' } });
});

afterAll(async () => {
  await (prisma as unknown as PrismaClient).stayRequest.deleteMany({ where: { message: 'integration-marker' } });
  await (prisma as unknown as PrismaClient).$disconnect();
});

describe('reads', () => {
  it('sorts the Explore feed by degree of separation, closest first', async () => {
    const feed = await caller(null).listings.byDegree();
    expect(feed.length).toBeGreaterThan(0);
    const degrees = feed.map((f) => f.degrees);
    expect([...degrees]).toEqual([...degrees].sort((a, b) => a - b));
    expect(feed[0].degrees).toBe(1);
  });

  it('returns a warm trust story for a host with consenting mutuals', async () => {
    const story = await caller(null).trust.story({ hostId: 'emma' });
    expect(story.warm).toBe(true);
    expect(story.channels.length).toBeGreaterThan(0);
  });
});

describe('ai intro (offline fallback)', () => {
  it('produces a non-empty intro from baked/composed content when no live model', async () => {
    const res = await caller(null).ai.intro({ hostId: 'emma' });
    expect(res.text.length).toBeGreaterThan(20);
    expect(['baked', 'composed', 'cached']).toContain(res.source);
  });
});

describe('auth gating', () => {
  it('blocks signup without an invite code', async () => {
    await expect(caller(null).auth.requestOtp({ email: 'nobody-integration@test.com' })).rejects.toThrow(/invite/i);
  });
});

describe('writes (user-scoped, host-guarded)', () => {
  it('lets a guest request a stay and only the host decide it', async () => {
    const you = await (prisma as unknown as PrismaClient).user.findUniqueOrThrow({ where: { email: 'you@kiki.demo' } });
    const dan = await (prisma as unknown as PrismaClient).user.findUniqueOrThrow({ where: { email: 'danica@kiki.demo' } });
    const youUser: SessionUser = { id: you.id, email: you.email };
    const danUser: SessionUser = { id: dan.id, email: dan.email };

    const req = await caller(youUser).requests.create({
      listingId: 'l-danica',
      fromDay: 400,
      toDay: 403,
      message: 'integration-marker',
      idempotencyKey: `it-${Date.now()}`,
    });
    expect(req.state).toBe('pending');

    // Guest cannot decide their own request.
    await expect(caller(youUser).requests.decide({ requestId: req.id, decision: 'accept' })).rejects.toThrow(/host/i);

    // Host accepts.
    const decided = await caller(danUser).requests.decide({ requestId: req.id, decision: 'accept' });
    expect(decided.state).toBe('accepted');
  });
});
