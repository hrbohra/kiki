import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const guestBookRouter = router({
  /** A guest writes a guest-book entry about a host. */
  add: protectedProcedure
    .input(
      z.object({
        hostId: z.string(),
        listingId: z.string(),
        text: z.string().min(1).max(2000),
        idempotencyKey: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => ctx.guestbook.add(ctx.user.id, input)),
});
