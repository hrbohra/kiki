import { router, protectedProcedure } from '../trpc';

export const worldRouter = router({
  /** The full world (members, listings, vouches, reviews, guest reviews, contributions) for the
   *  signed-in member's vantage point. The client rebuilds the same domain model with createWorld,
   *  so every screen renders live data through the exact same selectors — and "you" is the session
   *  user (per-viewer graph). */
  snapshot: protectedProcedure.query(async ({ ctx }) => {
    const data = await ctx.world.data();
    const me = await ctx.auth.me(ctx.user.id);
    return { ...data, viewerId: me.memberId ?? data.viewerId };
  }),
});
