import { router, publicProcedure } from '../trpc';

/** Explore: listings sorted by how close the host is to the viewer, never by price. */
export const listingsRouter = router({
  /** All listings, unsorted. */
  list: publicProcedure.query(async ({ ctx }) => {
    const { listings } = await ctx.world.data();
    return listings;
  }),

  /** The Explore feed: each listing with its host and degree of separation, closest first. */
  byDegree: publicProcedure.query(async ({ ctx }) => {
    const world = await ctx.world.world();
    return world
      .allListings()
      .map((listing) => ({
        listing,
        host: world.hostOf(listing),
        degrees: world.degreeToHost(listing.hostId),
      }))
      .sort((a, b) => a.degrees - b.degrees || a.listing.pricePerNight - b.listing.pricePerNight);
  }),
});
