// Demo-only persistence: remember that a visitor has seen the invite/onboarding flow, so a
// reload drops them into Explore rather than replaying setup. Web uses localStorage; native
// falls back to an in-memory flag (fine for a single Appetize session). Not product state —
// the real app would gate first-run server-side.

const KEY = 'kiki_onboarded';
let memFlag = false;

function store(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/** Has the visitor already been through (or skipped) onboarding? */
export function hasOnboarded(): boolean {
  const s = store();
  if (s) return s.getItem(KEY) === '1';
  return memFlag;
}

/** Mark onboarding as seen — called when the flow is finished or skipped. */
export function setOnboarded(): void {
  memFlag = true;
  store()?.setItem(KEY, '1');
}

/** Clear the flag so the flow shows again — the "Reset demo" affordance. */
export function resetOnboarded(): void {
  memFlag = false;
  store()?.removeItem(KEY);
}
