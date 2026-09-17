// Kiki stays are weeks long: storage counts nights, copy says weeks, and only drops to nights
// below one week. (The app keeps the same helper next to its screens.)

import { fmtWeeks } from './trips';

/** 28 → "4 weeks", 10 → "1.5 weeks", 3 → "3 nights". */
export function stayLength(nights: number): string {
  if (!Number.isFinite(nights) || nights < 7) return nights === 1 ? '1 night' : `${Math.max(0, Math.round(nights))} nights`;
  return fmtWeeks(Math.round((nights / 7) * 2) / 2);
}

/**
 * A smaller first stay to offer when two people have nobody in common: half the ask, in whole
 * weeks when the ask is in weeks, never less than one night. 14 → 7, 28 → 14, 3 → 1.
 */
export function shorterStay(nights: number): number {
  if (nights >= 14) return Math.max(7, Math.floor(nights / 14) * 7);
  if (nights >= 7) return 3;
  return Math.max(1, Math.floor(nights / 2));
}
