import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import type { WorldService } from '../world/world.service';
import type { AuthService } from '../auth/auth.service';
import type { RequestsService } from '../writes/requests.service';
import type { TripsService } from '../writes/trips.service';
import type { GuestBookService } from '../writes/guestbook.service';
import type { HouseListService } from '../writes/houselist.service';
import type { MessagingService } from '../messaging/messaging.service';
import type { MediaService } from '../media/media.service';
import type { IntroService } from '../ai/intro.service';
import type { DraftService } from '../ai/draft.service';
import type { Context } from './trpc';

export interface ContextDeps {
  world: WorldService;
  auth: AuthService;
  requests: RequestsService;
  trips: TripsService;
  guestbook: GuestBookService;
  houseList: HouseListService;
  messaging: MessagingService;
  media: MediaService;
  ai: IntroService;
  drafts: DraftService;
}

/** HTTP context: resolves the user from the Authorization header. */
export function makeCreateContext(deps: ContextDeps) {
  return ({ req }: CreateExpressContextOptions): Context => ({
    ...deps,
    user: deps.auth.userFromAuthHeader(req.headers.authorization),
  });
}

/** WebSocket context: resolves the user from connectionParams.token (WS has no auth header). */
export function makeCreateWsContext(deps: ContextDeps) {
  return (opts: CreateWSSContextFnOptions): Context => {
    const params = opts.info?.connectionParams as { token?: string } | undefined;
    return { ...deps, user: deps.auth.userFromToken(params?.token) };
  };
}
