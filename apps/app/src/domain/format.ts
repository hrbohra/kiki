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

/** 1st, 2nd, 3rd, 4th … 11th, 12th, 13th, 21st. One implementation: the Messages list once said "3th". */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const last = n % 10;
  return `${n}${last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th'}`;
}

const STEP_WORDS: Record<number, string> = { 1: 'One step', 2: 'Two steps', 3: 'Three steps', 4: 'Four steps', 5: 'Five steps', 6: 'Six steps' };

/** "One step from you", "Three steps from you": the same phrase on every screen. */
export function stepsFromYou(deg: number): string {
  return `${STEP_WORDS[deg] ?? `${deg} steps`} from you`;
}

/** A degree pill borrows mint only when someone in the chain can vouch (1st and 2nd degree). */
export function degreeTone(deg: number): 'tint' | 'outline' {
  return Number.isFinite(deg) && deg <= 2 ? 'tint' : 'outline';
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
