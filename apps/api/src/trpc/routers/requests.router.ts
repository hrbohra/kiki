import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const requestsRouter = router({
  /** A guest requests to stay at a listing. */
  create: protectedProcedure
    .input(
      z.object({
        listingId: z.string(),
        fromDay: z.number().int(),
        toDay: z.number().int(),
        message: z.string().max(1000).optional(),
        commitments: z.array(z.string().max(120)).max(20).optional(),
        idempotencyKey: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => ctx.requests.create(ctx.user.id, input)),

  /** The host inbox for the acting member's listings. */
  inbox: protectedProcedure.query(({ ctx }) => ctx.requests.inbox(ctx.user.id)),

  /** The guest's own requests. */
  mine: protectedProcedure.query(({ ctx }) => ctx.requests.mine(ctx.user.id)),

  /** The host accepts or declines a pending request. */
  decide: protectedProcedure
    .input(z.object({ requestId: z.string(), decision: z.enum(['accept', 'decline']) }))
    .mutation(({ ctx, input }) => ctx.requests.decide(ctx.user.id, input)),
});
