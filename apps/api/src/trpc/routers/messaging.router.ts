import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import type { WireMessage } from '../../messaging/messaging.service';

export const messagingRouter = router({
  /** The member's threads (most recent first, with unread counts). */
  threads: protectedProcedure.query(({ ctx }) => ctx.messaging.threads(ctx.user.id)),

  /** Open or fetch the 1:1 thread with another member (connection-gated). */
  open: protectedProcedure
    .input(z.object({ withId: z.string() }))
    .mutation(({ ctx, input }) => ctx.messaging.open(ctx.user.id, input.withId)),

  /** Full history for a thread. */
  history: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(({ ctx, input }) => ctx.messaging.history(ctx.user.id, input.threadId)),

  /** Send a message (persists + pushes to both participants in real time). */
  send: protectedProcedure
    .input(z.object({ threadId: z.string(), text: z.string().min(1).max(4000) }))
    .mutation(({ ctx, input }) => ctx.messaging.send(ctx.user.id, input.threadId, input.text)),

  /** Mark the other party's messages as read. */
  markRead: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(({ ctx, input }) => ctx.messaging.markRead(ctx.user.id, input.threadId)),

  /** Real-time subscription (WebSocket): new messages across the member's threads. */
  onMessage: protectedProcedure.subscription(async function* ({ ctx, signal }): AsyncGenerator<WireMessage> {
    for await (const msg of ctx.messaging.stream(ctx.user.id, signal)) {
      yield msg;
    }
  }),
});
