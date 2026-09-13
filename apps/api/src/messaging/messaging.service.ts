import { Inject, Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { shortestPath } from '@kiki/domain';
import { PrismaService } from '../prisma/prisma.service';
import { WorldService } from '../world/world.service';
import { actingMemberId } from '../common/actor';
import { MESSAGE_BUS, type MessageBus } from './message-bus';

export interface WireMessage {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

const channelFor = (memberId: string): string => `member:${memberId}`;
const orderedPair = (x: string, y: string): [string, string] => (x < y ? [x, y] : [y, x]);

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly world: WorldService,
    @Inject(MESSAGE_BUS) private readonly bus: MessageBus,
  ) {}

  /** Open (or fetch) the 1:1 thread with another member. Enforces Kiki's rule that you can only
   *  message people you're actually connected to. */
  async open(userId: string, withId: string) {
    const me = await actingMemberId(this.prisma, userId);
    if (me === withId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot message yourself.' });

    const world = await this.world.world();
    const path = shortestPath(world.graph, me, withId);
    if (!path || path.length === 0) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only message people you are connected to.' });
    }

    const [aId, bId] = orderedPair(me, withId);
    return this.prisma.thread.upsert({
      where: { aId_bId: { aId, bId } },
      update: {},
      create: { aId, bId },
    });
  }

  /** The member's threads, most-recent first, with the other participant, last message + unread count. */
  async threads(userId: string) {
    const me = await actingMemberId(this.prisma, userId);
    const rows = await this.prisma.thread.findMany({
      where: { OR: [{ aId: me }, { bId: me }] },
      orderBy: { updatedAt: 'desc' },
      include: {
        a: true,
        b: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    const withUnread = await Promise.all(
      rows.map(async (t) => {
        const other = t.aId === me ? t.b : t.a;
        const unread = await this.prisma.message.count({
          where: { threadId: t.id, senderId: { not: me }, readAt: null },
        });
        return { id: t.id, other, lastMessage: t.messages[0] ?? null, unread, updatedAt: t.updatedAt };
      }),
    );
    return withUnread;
  }

  /** Full message history for a thread the member is part of, oldest first. */
  async history(userId: string, threadId: string) {
    const me = await actingMemberId(this.prisma, userId);
    await this.assertParticipant(threadId, me);
    return this.prisma.message.findMany({ where: { threadId }, orderBy: { createdAt: 'asc' } });
  }

  /** Send a message; persists, touches the thread, and publishes to both participants' channels. */
  async send(userId: string, threadId: string, text: string) {
    const me = await actingMemberId(this.prisma, userId);
    const thread = await this.assertParticipant(threadId, me);

    const message = await this.prisma.message.create({
      data: { threadId, senderId: me, text },
    });
    await this.prisma.thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

    const wire: WireMessage = {
      id: message.id,
      threadId,
      senderId: me,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    };
    await this.bus.publish(channelFor(thread.aId), wire);
    await this.bus.publish(channelFor(thread.bId), wire);
    return message;
  }

  /** Mark the other party's messages in a thread as read. */
  async markRead(userId: string, threadId: string) {
    const me = await actingMemberId(this.prisma, userId);
    await this.assertParticipant(threadId, me);
    const res = await this.prisma.message.updateMany({
      where: { threadId, senderId: { not: me }, readAt: null },
      data: { readAt: new Date() },
    });
    return { marked: res.count };
  }

  /** Real-time stream of messages across the member's threads, as an async generator. */
  async *stream(userId: string, signal?: AbortSignal): AsyncGenerator<WireMessage> {
    const me = await actingMemberId(this.prisma, userId);
    const queue: WireMessage[] = [];
    let wake: (() => void) | null = null;

    const unsub = this.bus.subscribe(channelFor(me), (payload) => {
      queue.push(payload as WireMessage);
      wake?.();
      wake = null;
    });

    try {
      while (!signal?.aborted) {
        if (queue.length === 0) {
          await new Promise<void>((resolve) => {
            wake = resolve;
            signal?.addEventListener('abort', () => resolve(), { once: true });
          });
        }
        while (queue.length) {
          const next = queue.shift();
          if (next) yield next;
        }
      }
    } finally {
      unsub();
    }
  }

  private async assertParticipant(threadId: string, me: string) {
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw new TRPCError({ code: 'NOT_FOUND', message: 'Thread not found.' });
    if (thread.aId !== me && thread.bId !== me) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not part of this thread.' });
    }
    return thread;
  }
}
