import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const trustRouter = router({
  /** The full Trust-tab story for a host: mutuals, routes, overlaps, cold-state evidence. */
  story: publicProcedure.input(z.object({ hostId: z.string() })).query(async ({ ctx, input }) => {
    const world = await ctx.world.world();
    return world.trustStoryFor(input.hostId);
  }),

  /** The guest-book NLP roll-up for a host. */
  guestBook: publicProcedure.input(z.object({ hostId: z.string() })).query(async ({ ctx, input }) => {
    const world = await ctx.world.world();
    return world.guestBookOf(input.hostId);
  }),
});
