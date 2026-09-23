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
import { HouseListService } from '../writes/houselist.service';
import { MessagingService } from '../messaging/messaging.service';
import { InMemoryMessageBus } from '../messaging/message-bus';
import { MediaService } from '../media/media.service';
import { LocalDiskStorage } from '../media/storage';
import { IntroService } from '../ai/intro.service';
import { DraftService } from '../ai/draft.service';
import { AiRunner } from '../ai/ai-runner.service';
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
  const runner = new AiRunner(prisma, new PromptComposer(new PromptInjectionVoiceProvider()), new GeminiProvider());
  const ai = new IntroService(world, runner);
  const drafts = new DraftService(prisma, world, runner);
  return {
    world,
    auth,
    requests: new RequestsService(prisma, idem),
    trips: new TripsService(prisma, idem),
    guestbook,
    houseList: new HouseListService(prisma),
    messaging,
    media,
    ai,
    drafts,
  };
}

const deps = buildDeps();
const caller = (user: SessionUser | null) => appRouter.createCaller({ ...deps, user } as Context);

beforeAll(async () => {
  await (prisma as unknown as PrismaClient).stayRequest.deleteMany({ where: { message: 'integration-marker' } });
});

afterAll(async () => {
  await deps.world.resetDemoTraits();
  await deps.houseList.restoreSeeded();
  await (prisma as unknown as PrismaClient).stayRequest.deleteMany({ where: { guestId: 'you' } });
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

describe('ai drafts (cold state)', () => {
  it('drafts a message from the writer’s own vantage point, and only for a signed-in member', async () => {
    await expect(caller(null).ai.draft({ kind: 'introduce', memberId: 'priya', as: 'host', nights: 14 })).rejects.toThrow();
    const you = await (prisma as unknown as PrismaClient).user.findUniqueOrThrow({ where: { email: 'you@kiki.demo' } });
    const res = await caller({ id: you.id, email: you.email }).ai.draft({ kind: 'shorter', memberId: 'priya', as: 'host', nights: 14 });
    expect(res.task).toBe('draft.shorter');
    expect(res.text).toContain('Priya');
    expect(res.text.toLowerCase()).toContain('1 week');
    expect(['live', 'cached', 'baked']).toContain(res.source); // the demo member's cold card has a prepared draft
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
      // a guest agrees to what they'd be looking after (Miso) before they can ask
      commitments: (await deps.houseList.get('l-danica')).filter((i) => i.section === 'care').map((i) => i.id),
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

describe('your facts (edit without side effects)', () => {
  it('renaming a fact changes the overlaps it feeds, never the graph, and the demo reset restores it', async () => {
    process.env.DEMO_MODE = '1';
    const you = await (prisma as unknown as PrismaClient).user.findUniqueOrThrow({ where: { email: 'you@kiki.demo' } });
    const me = caller({ id: you.id, email: you.email });
    const sharesOrigin = (o: { kind: string; source?: string }) => o.kind === 'origin' && (o.source ?? 'profile') === 'profile';

    await deps.world.resetDemoTraits();
    const before = (await deps.world.world()).trustStoryFor('emma');
    expect(before.overlaps.some(sharesOrigin)).toBe(true); // you and Maia both moved from Mount Eden

    // The onboarding edit path: retire the old wording, save the new.
    await me.members.setTrait({ kind: 'origin', label: 'Mount Eden', on: false });
    await me.members.setTrait({ kind: 'origin', label: 'Ponsonby', on: true });
    const after = (await deps.world.world()).trustStoryFor('emma');
    expect(after.overlaps.some(sharesOrigin)).toBe(false); // the overlap followed the fact
    expect(after.degrees).toBe(before.degrees); // the vouch graph did not move
    expect(after.rankedRoutes.map((r) => r.members.map((m) => m.id).join('>'))).toEqual(
      before.rankedRoutes.map((r) => r.members.map((m) => m.id).join('>')),
    );

    await me.demo.reset();
    const restored = (await deps.world.world()).trustStoryFor('emma');
    expect(restored.overlaps.some(sharesOrigin)).toBe(true);
    const mine = await (prisma as unknown as PrismaClient).trait.findMany({ where: { memberId: 'you' } });
    expect(mine.map((t) => t.label)).not.toContain('Ponsonby');
  });
});

describe('house list (rules, would-love, looking after)', () => {
  it('is readable by anyone, editable only by the host, and its care items are commitments a request must agree to', async () => {
    const you = await (prisma as unknown as PrismaClient).user.findUniqueOrThrow({ where: { email: 'you@kiki.demo' } });
    const me = caller({ id: you.id, email: you.email });
    await deps.houseList.restoreSeeded();

    const danica = await caller(null).listings.houseList({ listingId: 'l-danica' });
    expect(danica.filter((i) => i.section === 'care').map((i) => i.text)).toEqual(['Feed Miso morning and evening', 'Fresh water and a clean litter tray daily']);

    // not your listing: you cannot edit it
    await expect(me.listings.setHouseList({ listingId: 'l-danica', items: [] })).rejects.toThrow(/Only the host/);
    // your own: you can
    const mine = await me.listings.setHouseList({ listingId: 'l-you', items: [{ section: 'care', text: 'Feed the fish', kind: 'pet' }] });
    expect(mine.map((i) => i.text)).toEqual(['Feed the fish']);

    // asking to stay at Danica's without agreeing to look after Miso is refused
    const care = danica.filter((i) => i.section === 'care').map((i) => i.id);
    await expect(me.requests.create({ listingId: 'l-danica', fromDay: 420, toDay: 427, commitments: [care[0]] })).rejects.toThrow(/Agree to the one thing/);
    // agreeing to both goes through, and the host's copy says what was agreed in words
    const ok = await me.requests.create({ listingId: 'l-danica', fromDay: 420, toDay: 427, commitments: care });
    expect(ok.commitments).toEqual(['Feed Miso morning and evening', 'Fresh water and a clean litter tray daily']);

    // the demo reset puts your own list back and clears what the demo visitor asked for
    await me.demo.reset();
    expect((await caller(null).listings.houseList({ listingId: 'l-you' })).map((i) => i.text)).toContain('Water the monstera once a week');
    expect(await (prisma as unknown as PrismaClient).stayRequest.count({ where: { guestId: 'you' } })).toBe(0);
  });
});
