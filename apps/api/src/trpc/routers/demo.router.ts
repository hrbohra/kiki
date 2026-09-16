import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

/**
 * Demo housekeeping. The public demo is a shared world: once a visitor accepts the seeded requests,
 * the "decide on a request" moment is gone for everyone after them. `reset` puts the seeded
 * decision state back so the demo stays evergreen. Only available while DEMO_MODE is on — it does
 * nothing in a real deployment.
 */
export const demoRouter = router({
  reset: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.auth.demoEnabled()) throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo reset is disabled.' });
    return ctx.requests.resetDemo();
  }),
});
