import { router } from './trpc';
import { authRouter } from './routers/auth.router';
import { membersRouter } from './routers/members.router';
import { listingsRouter } from './routers/listings.router';
import { trustRouter } from './routers/trust.router';
import { graphRouter } from './routers/graph.router';

/** The root tRPC router. Its type is exported for the type-safe client (@kiki/api-client). */
export const appRouter = router({
  auth: authRouter,
  members: membersRouter,
  listings: listingsRouter,
  trust: trustRouter,
  graph: graphRouter,
});

export type AppRouter = typeof appRouter;
