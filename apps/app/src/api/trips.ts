import { useEffect, useSyncExternalStore } from 'react';
import { WORLD_NOW_DAY } from '@kiki/domain';
import * as world from '../world';
import type { Trip, TripOffer } from '../domain/trips';
import { relRange } from '../domain/relDates';
import { stepsFromYou } from '../domain/format';
import type { KikiClient } from '@kiki/api-client';

/**
 * Your trips, from the API. The Trips tab, the offers screen and "Add a new trip" all read this one
 * store. It paints the bundled trip at once (so the tab is never empty while a free-tier API wakes)
 * and replaces it with what the server holds: your posted trips and the real members' offers on
 * them. Posting a trip is a real write; it survives a reload and shows on every device.
 */

interface ApiTrip {
  id: string;
  title: string;
  kind: string;
  fromDay: number;
  toDay: number;
  nights: number;
  budgetPerNight: number;
  createdAt: string | Date;
  offers: ApiOffer[];
}
interface ApiOffer {
  id: string;
  nights: number;
  total: number;
  requestedFromDay: number;
  requestedToDay: number;
  note: string | null;
  createdAt: string | Date;
  host: { id: string; name: string; country: string; avatarColor: string };
}

const tripRange = (fromDay: number, nights: number) => relRange(fromDay - WORLD_NOW_DAY, nights, { sep: '-', pad: true });
const halfWeeks = (nights: number) => Math.max(0.5, Math.round((nights / 7) * 2) / 2);

function sentAgo(when: string | Date): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(when).getTime()) / 86400000));
  return days === 0 ? 'Sent today' : days === 1 ? 'Sent 1 day ago' : `Sent ${days} days ago`;
}

function toOffer(o: ApiOffer): TripOffer {
  let facts: string[] = [];
  let matches = 0;
  try {
    const story = world.trustStoryFor(o.host.id);
    facts = [
      Number.isFinite(story.degrees) ? `${stepsFromYou(story.degrees)}${story.routes[0]?.[1] && story.degrees >= 2 ? `, through ${story.routes[0][1].name}` : ''}` : 'Not connected to you yet',
      ...(story.overlaps[0] ? [story.overlaps[0].label] : []),
    ];
    matches = story.guestTrackRecord.length;
  } catch {
    facts = [];
  }
  return {
    id: o.host.id,
    name: o.host.name,
    country: o.host.country,
    avatarTint: o.host.avatarColor,
    isNew: Date.now() - new Date(o.createdAt).getTime() < 7 * 86400000,
    sent: sentAgo(o.createdAt),
    matches,
    facts,
    weeks: halfWeeks(o.nights),
    total: o.total,
    requested: tripRange(o.requestedFromDay, o.requestedToDay - o.requestedFromDay),
    note: o.note ?? '',
  };
}

export function toTrip(t: ApiTrip): Trip {
  return {
    id: t.id,
    name: t.title,
    icon: t.kind,
    dates: tripRange(t.fromDay, t.nights),
    weeks: halfWeeks(t.nights),
    budget: t.budgetPerNight,
    offers: t.offers.map(toOffer),
  };
}

/** The seeded trip as the API returns it (prisma/seed.ts), used until the server answers. */
function bundledTrips(): Trip[] {
  const host = (id: string) => { const m = world.memberById(id); return { id: m.id, name: m.name, country: m.country, avatarColor: m.avatarColor }; };
  const ago = (days: number) => new Date(Date.now() - days * 86400000);
  return [toTrip({
    id: 'italy', title: 'Italy for Mum’s 60th', kind: 'Beach', fromDay: 500, toDay: 542, nights: 42, budgetPerNight: 45, createdAt: ago(5),
    offers: [
      { id: 'o-nate', nights: 35, total: 1575, requestedFromDay: 507, requestedToDay: 542, note: '5 of your 6 weeks — more than most get this season.', createdAt: ago(1), host: host('nate') },
      { id: 'o-priya', nights: 21, total: 945, requestedFromDay: 500, requestedToDay: 521, note: null, createdAt: ago(4), host: host('priya') },
    ],
  })];
}

// one store for every screen that shows trips
let trips: Trip[] | null = null;
let live = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const snapshot = (): Trip[] => (trips ??= bundledTrips());

export async function refreshTrips(api: KikiClient): Promise<void> {
  try {
    const rows = (await api.trips.mine.query()) as unknown as ApiTrip[];
    trips = rows.map(toTrip);
    live = true;
    emit();
  } catch {
    // keep what is on screen; a sleeping API is not a reason to empty the tab
  }
}

export function useMyTrips(api: KikiClient): { trips: Trip[]; live: boolean } {
  const list = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, snapshot, snapshot);
  useEffect(() => { void refreshTrips(api); }, [api]);
  return { trips: list, live };
}

export function tripById(id: string): Trip | undefined {
  const list = snapshot();
  return list.find((t) => t.id === id) ?? (id === 'italy' ? list.find((t) => t.name === 'Italy for Mum’s 60th') : undefined);
}

/** Post the weeks you are away. Returns the server's trip, already in the store. */
export async function postTrip(api: KikiClient, input: { title: string; kind: string; startIso: string; endIso: string; budgetPerNight: number; idempotencyKey: string }): Promise<Trip> {
  const dayOf = (iso: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return WORLD_NOW_DAY + Math.round((Date.parse(iso) - today.getTime()) / 86400000);
  };
  const row = (await api.trips.create.mutate({
    title: input.title,
    kind: input.kind,
    fromDay: dayOf(input.startIso),
    toDay: dayOf(input.endIso),
    budgetPerNight: Math.max(0, Math.round(input.budgetPerNight)),
    idempotencyKey: input.idempotencyKey,
  })) as unknown as ApiTrip;
  const trip = toTrip({ ...row, offers: row.offers ?? [] });
  trips = [trip, ...snapshot().filter((t) => t.id !== trip.id)];
  emit();
  return trip;
}
