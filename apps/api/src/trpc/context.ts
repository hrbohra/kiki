import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { WorldService } from '../world/world.service';
import type { AuthService } from '../auth/auth.service';
import type { RequestsService } from '../writes/requests.service';
import type { TripsService } from '../writes/trips.service';
import type { GuestBookService } from '../writes/guestbook.service';
import type { Context } from './trpc';

export interface ContextDeps {
  world: WorldService;
  auth: AuthService;
  requests: RequestsService;
  trips: TripsService;
  guestbook: GuestBookService;
}

/** Builds the per-request tRPC context: injects the Nest services and resolves the user from
 *  the Authorization header. */
export function makeCreateContext(deps: ContextDeps) {
  return ({ req }: CreateExpressContextOptions): Context => ({
    ...deps,
    user: deps.auth.userFromAuthHeader(req.headers.authorization),
  });
}
