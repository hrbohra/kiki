import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const membersRouter = router({
  /** All members in the world. */
  list: publicProcedure.query(async ({ ctx }) => {
    const { members } = await ctx.world.data();
    return members;
  }),

  /** One member by id. */
  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const world = await ctx.world.world();
    return world.memberById(input.id);
  }),

  /** People the viewer overlaps with, most-in-common first. */
  peopleLikeYou: publicProcedure.query(async ({ ctx }) => {
    const world = await ctx.world.world();
    return world.peopleLikeYou();
  }),

  /** Community leaderboard by contribution. */
  leaderboard: publicProcedure.query(async ({ ctx }) => {
    const world = await ctx.world.world();
    return world.leaderboard();
  }),
});
