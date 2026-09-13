import { Platform } from 'react-native';

// A soft, on-brand invite-code wall for the deployed demo — "prove you were invited," matching
// Kiki's invite-only DNA. It is NOT real security: this is a client-side check to keep casual
// visitors and crawlers out, not to protect secrets. Only a SHA-256 *hash* of the code ships in
// the bundle, so the code itself is never exposed; but a determined person could still bypass a
// client gate. For real protection you'd use Vercel Password Protection (paid) or a server check.
//
// Default code: "friend-of-bella" (case/space-insensitive). Change it by setting
// EXPO_PUBLIC_GATE_HASH to the SHA-256 hex of your normalised (trim + lowercase) code, or by
// swapping DEFAULT_HASH below. Native builds (Expo Go / iOS) are never gated.

const DEFAULT_HASH = 'b0c595b610139e2838d251f3f170730d3df91df7e9b369f4c96bc8077af29db8';
const EXPECTED_HASH = process.env.EXPO_PUBLIC_GATE_HASH || DEFAULT_HASH;
const KEY = 'kiki_gate_ok';

function unlockedStored(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Gate only the web build, and only until a correct code has been entered this browser.
 *  Set EXPO_PUBLIC_NO_GATE=1 at build time to ship an ungated web build (used for the portfolio
 *  "open the web view" embed, where a code wall contradicts a "quick look, no install" promise). */
export function needsGate(): boolean {
  if (process.env.EXPO_PUBLIC_NO_GATE === '1') return false;
  return Platform.OS === 'web' && !unlockedStored();
}

async function sha256hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Verify an entered code; on success, remember it for this browser. */
export async function verifyCode(code: string): Promise<boolean> {
  try {
    const hash = await sha256hex(code.trim().toLowerCase());
    if (hash === EXPECTED_HASH) {
      try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
