// The weeks-away planner is the inverse of Requests: there you are the host reading who wants to
// stay; here you are the one going away, and Kikiers answer with offers to cover your rent. An
// offer is partial by default — someone covers some of your weeks, not all — so the screen is
// built around weeks of rent covered, not a yes/no.

import { relRange } from './relDates';

export interface TripOffer {
  id: string;
  name: string;
  country: string;
  /** Kai/Sara aren't members, so their avatars render as initials rather than borrowing a face. */
  avatarTint: string;
  isNew: boolean;
  sent: string;
  matches: number;
  facts: string[];
  weeks: number; // weeks of your rent this Kikier can cover
  total: number; // GBP for their covered weeks
  requested: string; // the dates they asked for
  note: string; // benchmark note, or '' when there's a coverage gap instead
}

export interface Trip {
  id: string;
  name: string;
  icon: string;
  dates: string;
  weeks: number;
  budget: number; // GBP per night — what would cover the rent, in the unit Kiki prices in
  offers: TripOffer[];
}

/** Named reasons to be away, shown as text chips (no emoji). Stored on Trip.icon. */
export const TRIP_KINDS = ['Beach', 'Mountains', 'Party', 'Work', 'Art', 'Food'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Zero-padded "DD Mon - DD Mon" to match this screen's house style.
const tripRange = (startInDays: number, nights: number) => relRange(startInDays, nights, { sep: '-', pad: true });

/** The fixtured stretch away, exercising both offer variants: Kai (5/6 weeks, benchmark note,
 *  one-week gap) and Sara (3/6, no note, three-week gap). Dates are relative to now so the demo never goes stale. */
export const ITALY_TRIP: Trip = {
  id: 'italy', name: 'Italy for Mum’s 60th', icon: 'Beach', dates: tripRange(35, 42), weeks: 6, budget: 45,
  offers: [
    {
      id: 'sam', name: 'Kai Gowen', country: 'NZ', avatarTint: '#5B7DB1', isNew: true, sent: 'Sent 1 day ago',
      matches: 3, facts: ['Male, 26', 'Founding Operations @Kiki', 'Grew up in Auckland'],
      weeks: 5, total: 1575, requested: tripRange(42, 35),
      note: 'Based on similar Kikis right now, 5 of 6 weeks is more than most people are getting for this seasonality!',
    },
    {
      id: 'sara', name: 'Sara Foster', country: 'AU', avatarTint: '#B15B93', isNew: true, sent: 'Sent 4 days ago',
      matches: 1, facts: ['Female, 34', 'Occupational Therapist', 'Grew up in Perth'],
      weeks: 3, total: 945, requested: tripRange(35, 21), note: '',
    },
  ],
};

/** ISO date → the app's short form, e.g. '2027-06-07' → '07 Jun'. */
export function shortDate(iso: string): string {
  const parts = String(iso).split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]} ${MONTHS[Number(parts[1]) - 1]}`;
}

/** Weeks between two ISO dates, to the nearest half week; 0 (never negative) when either is invalid. */
export function weeksBetween(start: string, end: string): number {
  const a = Date.parse(start), b = Date.parse(end);
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(0, Math.round(((b - a) / 86400000 / 7) * 2) / 2);
}

/** 6 → "6 weeks", 1 → "1 week", 2.5 → "2.5 weeks". */
export function fmtWeeks(weeks: number): string {
  const w = Number.isInteger(weeks) ? String(weeks) : weeks.toFixed(1).replace(/\.0$/, '');
  return `${w} ${weeks === 1 ? 'week' : 'weeks'}`;
}

export interface OfferView extends TripOffer {
  weeksLabel: string;
  totalLabel: string;
  perNightLabel: string;
  matchesLabel: string;
  pct: number;
  yours: string;
  hasNote: boolean;
  hasGap: boolean;
  /** The card shows the caution box only when there's no benchmark note above it; the modal
   *  states the gap either way. Without this the first card stacks two advisory boxes. */
  showGapBox: boolean;
  gapLine: string;
}

/** Derive an offer's display fields against the stretch away — coverage %, per-night rate, gap copy. */
export function offerView(o: TripOffer, trip: Trip): OfferView {
  const gap = trip.weeks - o.weeks;
  return {
    ...o,
    weeksLabel: `${fmtWeeks(o.weeks).replace(/ weeks?$/, '')} of your ${fmtWeeks(trip.weeks)}`,
    totalLabel: `£${o.total.toLocaleString('en-GB')}`,
    perNightLabel: `£${Math.round(o.total / (o.weeks * 7))} / night`,
    matchesLabel: o.matches > 0 ? `${o.matches} Kiki ${o.matches === 1 ? 'match' : 'matches'}` : 'New to Kiki stays',
    pct: Math.round((o.weeks / trip.weeks) * 100),
    yours: trip.dates,
    hasNote: !!o.note,
    hasGap: gap > 0,
    showGapBox: gap > 0 && !o.note,
    gapLine: `Leaves ${fmtWeeks(gap)} of your rent uncovered.`,
  };
}
