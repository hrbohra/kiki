// @kiki/api-client — the single, type-safe way every frontend (native iOS + web, one source)
// talks to the Kiki API. Shipped as TS source; the app's bundler compiles it.
import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  wsLink,
  type TRPCClient,
} from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@kiki/api/contract';

export type { AppRouter } from '@kiki/api/contract';
export type KikiClient = TRPCClient<AppRouter>;

export interface KikiClientOptions {
  /** tRPC HTTP endpoint, e.g. https://api.kiki.example/trpc */
  httpUrl: string;
  /** tRPC WebSocket endpoint for subscriptions, e.g. wss://api.kiki.example/trpc. Optional. */
  wsUrl?: string;
  /** Returns the current access token (or null). Injected as a bearer header (HTTP) and as
   *  connectionParams.token (WS). */
  getToken?: () => string | null | undefined;
}

/** Build a typed tRPC client. Queries/mutations go over HTTP; subscriptions over WebSocket when
 *  wsUrl is provided. superjson keeps Dates/etc. intact end-to-end. */
export function createKikiClient(opts: KikiClientOptions): KikiClient {
  const authHeaders = () => {
    const token = opts.getToken?.();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const httpLink = httpBatchLink({ url: opts.httpUrl, transformer: superjson, headers: authHeaders });

  if (!opts.wsUrl) {
    return createTRPCClient<AppRouter>({ links: [httpLink] });
  }

  const wsClient = createWSClient({
    url: opts.wsUrl,
    // Connect on first subscription (not at creation), so connectionParams reads the token that
    // exists after sign-in — and reconnects pick up a refreshed token.
    lazy: { enabled: true, closeMs: 1000 },
    connectionParams: () => ({ token: opts.getToken?.() ?? undefined }),
  });

  return createTRPCClient<AppRouter>({
    links: [
      splitLink({
        condition: (op) => op.type === 'subscription',
        true: wsLink({ client: wsClient, transformer: superjson }),
        false: httpLink,
      }),
    ],
  });
}
