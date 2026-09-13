import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { WorldService } from '../world/world.service';

/** tRPC request context. WorldService is resolved from Nest and injected per request. */
export interface Context {
  world: WorldService;
}

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;
