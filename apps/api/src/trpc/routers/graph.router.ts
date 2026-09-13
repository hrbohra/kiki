import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const graphRouter = router({
  /** The connection story (path + overlaps) from the viewer to a host. */
  storyTo: publicProcedure.input(z.object({ hostId: z.string() })).query(async ({ ctx, input }) => {
    const world = await ctx.world.world();
    return world.storyFor(input.hostId);
  }),

  /** The viewer's direct connections, by name. */
  viewerFriends: publicProcedure.query(async ({ ctx }) => {
    const world = await ctx.world.world();
    return world.viewerFriendNames();
  }),
});
