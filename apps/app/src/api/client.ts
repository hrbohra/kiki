import { createKikiClient } from '@kiki/api-client';
import type { SessionUser } from './session';

// API base — override per environment with EXPO_PUBLIC_API_URL (e.g. the deployed API on Render).
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

let token: string | null = null;

export function getToken(): string | null {
  return token;
}

export function setToken(next: string | null): void {
  token = next;
  try {
    if (typeof localStorage === 'undefined') return;
    if (next) localStorage.setItem('kiki_token', next);
    else localStorage.removeItem('kiki_token');
  } catch {
    /* native / no storage — in-memory only */
  }
}

export function loadToken(): string | null {
  try {
    if (typeof localStorage !== 'undefined') token = localStorage.getItem('kiki_token');
  } catch {
    /* ignore */
  }
  return token;
}

/** The signed-in member is remembered beside the token, so a returning visitor is inside the app
 *  before the network answers. The server still verifies the token in the background. */
export function saveUser(user: SessionUser | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (user) localStorage.setItem('kiki_user', JSON.stringify(user));
    else localStorage.removeItem('kiki_user');
  } catch {
    /* ignore */
  }
}

export function loadUser(): SessionUser | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('kiki_user');
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

/** The public demo runs on a free tier that sleeps when idle and takes 30–60s to wake. The first
 *  thing this bundle does is knock on the door, so the wake-up overlaps the bundle's own start-up
 *  instead of following it. Fire-and-forget; nothing waits on it. */
export function wakeApi(): void {
  try {
    void fetch(`${API_BASE}/health`, { cache: 'no-store' }).catch(() => {});
  } catch {
    /* ignore */
  }
}
wakeApi();

/** The one typed client the whole app uses. */
export const api = createKikiClient({
  httpUrl: `${API_BASE}/trpc`,
  wsUrl: `${WS_BASE}/trpc`,
  getToken,
});
