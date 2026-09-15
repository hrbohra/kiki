// Demo dates anchored to "now" so the seeded world never reads as stale (a window in the past
// when the real backend claims to be live). One helper, used by every screen that shows example
// dates. Kept tiny and side-effect-free apart from reading the clock at call time.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A "D Mon – D Mon" window relative to today. `startInDays` may be negative to point at the past
 * (e.g. a completed stay). `sep`/`pad` cover the two house styles already in the app.
 */
export function relRange(
  startInDays: number,
  nights: number,
  opts: { sep?: string; pad?: boolean } = {},
): string {
  const sep = opts.sep ?? '–';
  const fmt = (d: Date) =>
    `${opts.pad ? String(d.getDate()).padStart(2, '0') : d.getDate()} ${MONTHS[d.getMonth()]}`;
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  a.setDate(a.getDate() + startInDays);
  const b = new Date(a);
  b.setDate(b.getDate() + nights);
  return `${fmt(a)} ${sep} ${fmt(b)}`;
}
