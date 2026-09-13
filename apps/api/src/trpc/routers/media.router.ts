import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const mediaRouter = router({
  /** Attach an uploaded image URL as the acting member's avatar. */
  attachAvatar: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(({ ctx, input }) => ctx.media.attachAvatar(ctx.user.id, input.url)),

  /** Attach an uploaded image URL as a listing's photo (host only). */
  attachListingPhoto: protectedProcedure
    .input(z.object({ listingId: z.string(), url: z.string().url() }))
    .mutation(({ ctx, input }) => ctx.media.attachListingPhoto(ctx.user.id, input.listingId, input.url)),
});
