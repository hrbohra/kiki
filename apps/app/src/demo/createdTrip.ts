import { useSyncExternalStore } from 'react';

import type { Trip } from '../domain/trips';

// Session-only store for a stretch away the user posts from "List my place while I’m away". One at a time, lost on reload
// (matches the handoff's stated scope). Kept out of navigation params so the Trips list can show
// the created card without threading it through every screen.

let created: Trip | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function getCreatedTrip(): Trip | null {
  return created;
}

export function setCreatedTrip(trip: Trip): void {
  created = trip;
  emit();
}

/** Subscribe a component to the created trip so it re-renders when one is posted. */
export function useCreatedTrip(): Trip | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getCreatedTrip,
    getCreatedTrip,
  );
}
