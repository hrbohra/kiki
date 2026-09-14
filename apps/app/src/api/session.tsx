import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, loadToken, setToken } from './client';

export interface SessionUser {
  id: string;
  email: string;
  memberId: string | null;
}

interface SessionValue {
  user: SessionUser | null;
  ready: boolean; // finished the initial token check
  demoAvailable: boolean;
  demoLogin: () => Promise<void>;
  requestOtp: (email: string, inviteCode?: string) => Promise<{ purpose: string; devCode?: string }>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  signOut: () => void;
  api: typeof api;
}

const Ctx = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [demoAvailable, setDemoAvailable] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await api.auth.config.query();
        setDemoAvailable(cfg.demoLogin);
      } catch {
        /* ignore */
      }
      const existing = loadToken();
      if (existing) {
        try {
          const me = await api.auth.me.query();
          setUser({ id: me.id, email: me.email, memberId: me.memberId });
        } catch {
          setToken(null);
        }
      }
      setReady(true);
    })();
  }, []);

  const demoLogin = async () => {
    const res = await api.auth.demoLogin.mutate();
    setToken(res.accessToken);
    setUser({ id: res.user.id, email: res.user.email, memberId: res.user.memberId });
  };

  const requestOtp = async (email: string, inviteCode?: string) => {
    const res = await api.auth.requestOtp.mutate({ email, inviteCode });
    return { purpose: res.purpose, devCode: res.devCode };
  };

  const verifyOtp = async (email: string, code: string) => {
    const res = await api.auth.verifyOtp.mutate({ email, code });
    setToken(res.accessToken);
    setUser({ id: res.user.id, email: res.user.email, memberId: res.user.memberId });
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, ready, demoAvailable, demoLogin, requestOtp, verifyOtp, signOut, api }}>
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
