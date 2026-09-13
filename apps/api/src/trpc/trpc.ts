import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { WorldService } from '../world/world.service';
import type { AuthService, SessionUser } from '../auth/auth.service';

/** tRPC request context — services resolved from Nest, plus the current user (if authenticated). */
export interface Context {
  world: WorldService;
  auth: AuthService;
  user: SessionUser | null;
}

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;

/** Requires a valid access token; narrows ctx.user to non-null for the resolver. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in required.' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
