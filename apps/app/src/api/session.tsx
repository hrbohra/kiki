import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, loadToken, loadUser, saveUser, setToken } from './client';

export interface SessionUser {
  id: string;
  email: string;
  memberId: string | null;
}

interface SessionValue {
  user: SessionUser | null;
  /** Always true now: nothing on screen waits for the network. Kept for callers. */
  ready: boolean;
  demoAvailable: boolean;
  /** Set while a sign-in is waiting on a sleeping server: when the wait started (ms). */
  wakingSince: number | null;
  demoLogin: () => Promise<void>;
  requestOtp: (email: string, inviteCode?: string) => Promise<{ purpose: string; devCode?: string }>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  signOut: () => void;
  api: typeof api;
}

const Ctx = createContext<SessionValue | null>(null);

const codeOf = (e: unknown) => (e as { data?: { code?: string } } | null)?.data?.code;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Session. Two rules, both about the first second:
 *  - the screen never waits for the network: a returning visitor is restored from storage and
 *    verified in the background; a new visitor sees the entry screen at once;
 *  - a sleeping free-tier server is a wait, not an error: sign-in retries while it wakes and tells
 *    the screen how long it has been waiting, so the screen can say so.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => (loadToken() ? loadUser() : null));
  const [demoAvailable, setDemoAvailable] = useState(true);
  const [wakingSince, setWakingSince] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    api.auth.config.query().then((cfg) => { if (alive) setDemoAvailable(cfg.demoLogin); }).catch(() => {});
    if (loadToken()) {
      api.auth.me.query()
        .then((me) => { if (!alive) return; const u = { id: me.id, email: me.email, memberId: me.memberId }; setUser(u); saveUser(u); })
        .catch((e) => {
          // only a definite "no" signs you out; a slow or sleeping server is not a verdict
          if (alive && codeOf(e) === 'UNAUTHORIZED') { setToken(null); saveUser(null); setUser(null); }
        });
    }
    return () => { alive = false; };
  }, []);

  const signIn = (res: { accessToken: string; user: SessionUser }) => {
    setToken(res.accessToken);
    saveUser(res.user);
    setUser(res.user);
  };

  /** Keeps knocking for up to two minutes while the server wakes; gives up only on a real refusal. */
  const demoLogin = async () => {
    const started = Date.now();
    for (;;) {
      try {
        const res = await api.auth.demoLogin.mutate();
        setWakingSince(null);
        signIn({ accessToken: res.accessToken, user: { id: res.user.id, email: res.user.email, memberId: res.user.memberId } });
        return;
      } catch (e) {
        const refused = codeOf(e) === 'UNAUTHORIZED' || codeOf(e) === 'FORBIDDEN' || codeOf(e) === 'BAD_REQUEST';
        if (refused || Date.now() - started > 120_000) { setWakingSince(null); throw e; }
        setWakingSince((s) => s ?? started);
        await sleep(2500);
      }
    }
  };

  const requestOtp = async (email: string, inviteCode?: string) => {
    const res = await api.auth.requestOtp.mutate({ email, inviteCode });
    return { purpose: res.purpose, devCode: res.devCode };
  };

  const verifyOtp = async (email: string, code: string) => {
    const res = await api.auth.verifyOtp.mutate({ email, code });
    signIn({ accessToken: res.accessToken, user: { id: res.user.id, email: res.user.email, memberId: res.user.memberId } });
  };

  const signOut = () => {
    setToken(null);
    saveUser(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, ready: true, demoAvailable, wakingSince, demoLogin, requestOtp, verifyOtp, signOut, api }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession(): SessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used within SessionProvider');
  return v;
}

export { getToken };
