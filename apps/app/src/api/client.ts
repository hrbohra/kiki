import { createKikiClient } from '@kiki/api-client';

// API base — override per environment with EXPO_PUBLIC_API_URL (e.g. the deployed API on Vercel).
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

/** The one typed client the whole app uses. */
export const api = createKikiClient({
  httpUrl: `${API_BASE}/trpc`,
  wsUrl: `${WS_BASE}/trpc`,
  getToken,
});
