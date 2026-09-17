import { router, publicProcedure } from '../trpc';

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
});
