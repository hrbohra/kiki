import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { WorldService } from '../world/world.service';
import type { AuthService } from '../auth/auth.service';
import type { Context } from './trpc';

/** Builds the per-request tRPC context: injects the Nest services and resolves the user from
 *  the Authorization header. */
export function makeCreateContext(world: WorldService, auth: AuthService) {
  return ({ req }: CreateExpressContextOptions): Context => ({
    world,
    auth,
    user: auth.userFromAuthHeader(req.headers.authorization),
  });
}
