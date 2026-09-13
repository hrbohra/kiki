import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const aiRouter = router({
  /** The mutual-friend intro for a host, generated server-side from the live trust graph.
   *  Returns the text and which source produced it (live/cached/baked/composed). */
  intro: publicProcedure
    .input(z.object({ hostId: z.string() }))
    .query(({ ctx, input }) => ctx.ai.forHost(input.hostId)),
});
