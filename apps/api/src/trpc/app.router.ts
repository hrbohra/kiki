import { router } from './trpc';
import { authRouter } from './routers/auth.router';
import { membersRouter } from './routers/members.router';
import { listingsRouter } from './routers/listings.router';
import { trustRouter } from './routers/trust.router';
import { graphRouter } from './routers/graph.router';
import { requestsRouter } from './routers/requests.router';
import { tripsRouter } from './routers/trips.router';
import { guestBookRouter } from './routers/guestbook.router';
import { messagingRouter } from './routers/messaging.router';
import { mediaRouter } from './routers/media.router';
import { aiRouter } from './routers/ai.router';
import { worldRouter } from './routers/world.router';

/** The root tRPC router. Its type is exported for the type-safe client (@kiki/api-client). */
export const appRouter = router({
  auth: authRouter,
  members: membersRouter,
  listings: listingsRouter,
  trust: trustRouter,
  graph: graphRouter,
  requests: requestsRouter,
  trips: tripsRouter,
  guestbook: guestBookRouter,
  messaging: messagingRouter,
  media: mediaRouter,
  ai: aiRouter,
  world: worldRouter,
});

export type AppRouter = typeof appRouter;
