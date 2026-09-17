import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const aiRouter = router({
  /** The mutual-friend intro for a host, generated server-side from the live trust graph.
   *  Returns the text and which source produced it (live/cached/baked/composed). */
  intro: publicProcedure
    .input(z.object({ hostId: z.string() }))
    .query(({ ctx, input }) => ctx.ai.forHost(input.hostId)),

  /** A first draft of a message between two members who have nobody in common yet: a proper
   *  introduction, a call before deciding, or a shorter first stay. Text only — the member edits
   *  and sends it through messaging.send like any other message. */
  draft: protectedProcedure
    .input(
      z.object({
        kind: z.enum(['introduce', 'call', 'shorter']),
        memberId: z.string(),
        as: z.enum(['host', 'guest']),
        nights: z.number().int().min(1).max(365).optional(),
      }),
    )
    .query(({ ctx, input }) => ctx.drafts.draft(ctx.user.id, input)),
});
