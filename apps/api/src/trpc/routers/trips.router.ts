import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const tripsRouter = router({
  /** Post a trip (out for offers). */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(120),
        kind: z.string().min(1).max(40),
        fromDay: z.number().int(),
        toDay: z.number().int(),
        budgetPerNight: z.number().int().min(0),
        idempotencyKey: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => ctx.trips.create(ctx.user.id, input)),

  /** The traveller's own trips + offers. */
  mine: protectedProcedure.query(({ ctx }) => ctx.trips.mine(ctx.user.id)),
});
