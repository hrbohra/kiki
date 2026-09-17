// One formatter each for money, dates, relative time and plurals (craft audit, "Global"). Every
// screen that shows a number goes through here, so £310 never becomes £310.00 on one card and
// £310 on the next, and a date range collapses the month the same way everywhere.

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** £310, £1,240 — whole pounds, thousands separated, never decimals under £10k. */
export function money(pounds: number): string {
  const n = Math.round(pounds);
  return `£${Math.abs(n).toLocaleString('en-GB')}`.replace('£', n < 0 ? '−£' : '£');
}

/** One word for one thing, the plural for anything else: plural(2, 'offer') → "2 offers". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function dayFromNow(offset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

/**
 * A date window relative to today: "3 – 17 Oct" inside one month, "20 Oct – 3 Nov" across
 * months, and the full month ("14 – 21 September") where the moment deserves it.
 */
export function dateRange(startInDays: number, nights: number, opts: { long?: boolean } = {}): string {
  const a = dayFromNow(startInDays);
  const b = dayFromNow(startInDays + nights);
  const months = opts.long ? MONTHS_LONG : MONTHS_SHORT;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()} – ${b.getDate()} ${months[a.getMonth()]}`;
  return `${a.getDate()} ${months[a.getMonth()]} – ${b.getDate()} ${months[b.getMonth()]}`;
}

/** "Monday 8 September" — a single date, in full. */
export function fullDate(offsetDays: number): string {
  const d = dayFromNow(offsetDays);
  return `${DAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
}

/** "in 3 weeks", "yesterday", "last April" — relative time for lists. */
export function relativeTime(offsetDays: number): string {
  const d = Math.round(offsetDays);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d === -1) return 'yesterday';
  const abs = Math.abs(d);
  const unit = abs >= 60 ? plural(Math.round(abs / 30), 'month') : abs >= 14 ? plural(Math.round(abs / 7), 'week') : plural(abs, 'day');
  return d > 0 ? `in ${unit}` : `${unit} ago`;
}
