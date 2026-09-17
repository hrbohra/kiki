// Kiki stays are weeks long: storage counts nights (whole days between two day numbers), but
// nobody at Kiki says "28 nights". Copy says weeks, and only drops to nights below one week.

/** 28 → "4 weeks", 10 → "1.5 weeks", 3 → "3 nights". */
export function stayLength(nights: number): string {
  if (!Number.isFinite(nights) || nights < 7) return nights === 1 ? '1 night' : `${Math.max(0, Math.round(nights))} nights`;
  return fmtWeeks(Math.round((nights / 7) * 2) / 2);
}

/** 6 → "6 weeks", 1 → "1 week", 2.5 → "2.5 weeks". */
export function fmtWeeks(weeks: number): string {
  const w = Number.isInteger(weeks) ? String(weeks) : weeks.toFixed(1).replace(/\.0$/, '');
  return `${w} ${weeks === 1 ? 'week' : 'weeks'}`;
}
