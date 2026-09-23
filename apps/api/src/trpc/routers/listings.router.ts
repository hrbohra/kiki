import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

/** Explore: listings sorted by how close the host is to the viewer, never by price. */
export const listingsRouter = router({
  /** All listings, unsorted. */
  list: publicProcedure.query(async ({ ctx }) => {
    const { listings } = await ctx.world.data();
    return listings;
  }),

  /** The Explore feed: each listing with its host, connection story, and degree of separation,
   *  closest first (never by price). Everything a listing card needs, in one call. */
  byDegree: publicProcedure.query(async ({ ctx }) => {
    const world = await ctx.world.world();
    return world
      .allListings()
      // your own place is not something you explore (the seeded viewer hosts one)
      .filter((listing) => listing.hostId !== world.viewerId)
      .map((listing) => ({
        listing,
        host: world.hostOf(listing),
        story: world.storyFor(listing.hostId),
        degrees: world.degreeToHost(listing.hostId),
      }))
      .sort((a, b) => a.degrees - b.degrees || a.listing.pricePerNight - b.listing.pricePerNight);
  }),

  /** A listing's house list: rules, things the host would love, things a guest would look after. */
  houseList: publicProcedure
    .input(z.object({ listingId: z.string().max(80) }))
    .query(({ ctx, input }) => ctx.houseList.get(input.listingId)),

  /** The host replaces their own house list. */
  setHouseList: protectedProcedure
    .input(z.object({
      listingId: z.string().max(80),
      items: z.array(z.object({
        section: z.enum(['rule', 'love', 'care']),
        text: z.string().trim().min(2).max(120),
        detail: z.string().trim().max(160).optional(),
        kind: z.enum(['pet', 'plants', 'post', 'home', 'quiet', 'people']).optional(),
      })).max(24),
    }))
    .mutation(({ ctx, input }) => ctx.houseList.set(ctx.user.id, input.listingId, input.items)),
});
