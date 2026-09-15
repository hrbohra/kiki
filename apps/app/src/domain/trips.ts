// The trip planner is the inverse of Requests: there you are the host reading who wants to stay;
// here you are the traveller who posts a trip and hosts answer with offers. An offer is partial
// by default — a host covers some of your nights, not all — so the screen is built around nights
// coverage, not a yes/no.

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
  nights: number; // nights this host can cover
  total: number; // GBP for their covered nights
  requested: string; // the dates they asked for
  note: string; // benchmark note, or '' when there's a coverage gap instead
}

export interface Trip {
  id: string;
  name: string;
  icon: string;
  dates: string;
  nights: number;
  budget: number; // per night
  offers: TripOffer[];
}

/** Named trip kinds, shown as text chips (no emoji). Stored on Trip.icon. */
export const TRIP_KINDS = ['Beach', 'Mountains', 'Party', 'Work', 'Art', 'Food'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Demo dates anchored to "now" so the seeded trip never reads as stale (a window in the past).
 *  Formats a "DD Mon - DD Mon" range `startInDays` from today, spanning `nights`. */
function relRange(startInDays: number, nights: number): string {
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`;
  const a = new Date(); a.setHours(0, 0, 0, 0); a.setDate(a.getDate() + startInDays);
  const b = new Date(a); b.setDate(b.getDate() + nights);
  return `${fmt(a)} - ${fmt(b)}`;
}

/** The fixtured trip, exercising both offer variants: Kai (12/13, benchmark note, one-night gap)
 *  and Sara (8/13, no note, five-night gap). Dates are relative to now so the demo never goes stale. */
export const ITALY_TRIP: Trip = {
  id: 'italy', name: 'Italy bday trip', icon: 'Beach', dates: relRange(35, 13), nights: 13, budget: 40,
  offers: [
    {
      id: 'sam', name: 'Kai Gowen', country: 'NZ', avatarTint: '#5B7DB1', isNew: true, sent: 'Sent 1 day ago',
      matches: 3, facts: ['Male, 26', 'Founding Operations @Kiki', 'Grew up in Auckland'],
      nights: 12, total: 480, requested: relRange(36, 12),
      note: 'Based on similar Kiki’s right now, 12 of 13 nights is more than most people are getting for this seasonality!',
    },
    {
      id: 'sara', name: 'Sara Foster', country: 'AU', avatarTint: '#B15B93', isNew: true, sent: 'Sent 4 days ago',
      matches: 1, facts: ['Female, 34', 'Occupational Therapist', 'Grew up in Perth'],
      nights: 8, total: 320, requested: relRange(35, 8), note: '',
    },
  ],
};

/** ISO date → the app's short form, e.g. '2027-06-07' → '07 Jun'. */
export function shortDate(iso: string): string {
  const parts = String(iso).split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]} ${MONTHS[Number(parts[1]) - 1]}`;
}

/** Whole nights between two ISO dates; 0 (never negative) when either is invalid. */
export function nightsBetween(start: string, end: string): number {
  const a = Date.parse(start), b = Date.parse(end);
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

export interface OfferView extends TripOffer {
  nightsLabel: string;
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

/** Derive an offer's display fields against its trip — coverage %, per-night rate, gap copy. */
export function offerView(o: TripOffer, trip: Trip): OfferView {
  const gap = trip.nights - o.nights;
  return {
    ...o,
    nightsLabel: `${o.nights} of your ${trip.nights} nights`,
    totalLabel: `£${o.total.toFixed(2)}`,
    perNightLabel: `£${Math.round(o.total / o.nights)} / night`,
    matchesLabel: `${o.matches} Kiki ${o.matches === 1 ? 'match' : 'matches'}`,
    pct: Math.round((o.nights / trip.nights) * 100),
    yours: trip.dates,
    hasNote: !!o.note,
    hasGap: gap > 0,
    showGapBox: gap > 0 && !o.note,
    gapLine: gap === 1 ? 'Leaves 1 night of your trip uncovered.' : `Leaves ${gap} nights of your trip uncovered.`,
  };
}
