import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

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

  /** Add or remove one of your own facts, the things people are matched on. */
  setTrait: protectedProcedure
    .input(z.object({ kind: z.enum(['origin', 'education', 'interest', 'work', 'event']), label: z.string().trim().min(1).max(80), on: z.boolean() }))
    .mutation(({ ctx, input }) => ctx.world.setTrait(ctx.user.id, input)),

  /** Community leaderboard by contribution. */
  leaderboard: publicProcedure.query(async ({ ctx }) => {
    const world = await ctx.world.world();
    return world.leaderboard();
  }),
});
