// Generates a Kiki-sized synthetic world (5,000 members, invite tree, vouches, listings,
// absences, matches, guest-book entries). Deterministic for a given seed. No real people.
//
// Why a generator and not fixtures: at 14 members "two steps from you" is common. At 5,000 with
// a realistic invite tree (median degree 5) only ~1% of members and ~1.4% of hosts are within two
// steps of a random viewer; 62% are five or more away. Every screen that says "two steps" has to
// be designed against that truth, and the only way to see it is to generate the world.
//
// Usage:  const world = generateWorld({ members: 5000, seed: 20260917 });
//         then pipe through the same import path as real data (apps/api/import/seed-world.ts).

import type { Listing, Member, Trait, Vouch, GuestReview } from './domain/types';

export interface SeedOptions { members?: number; seed?: number; days?: number; hostShare?: number; matches?: number }
export interface Absence { listingId: string; hostId: string; start: number; weeks: number }
export interface Match { id: string; hostId: string; guestId: string; listingId: string; start: number; weeks: number }
export interface SeedMember extends Member { female: boolean; age: number; areaIndex: number; joinDay: number }
export interface SeedVouch extends Vouch { kind: 'invite' | 'event' | 'friend' | 'stay'; day: number }
export interface SeedWorld { members: SeedMember[]; vouches: SeedVouch[]; listings: Listing[]; absences: Absence[]; matches: Match[]; guestReviews: GuestReview[]; inviterOf: Map<string, string> }

// mulberry32 — small, fast, reproducible
function rng(seed: number) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const COUNTRIES: [string, number][] = [['NZ', 30], ['AU', 30], ['GB', 18], ['IE', 9], ['ZA', 5], ['US', 4], ['CA', 2], ['FR', 2]];
const ORIGINS: Record<string, string[]> = { NZ: ['Mount Eden', 'Ponsonby', 'Grey Lynn', 'Wellington', 'Christchurch', 'Tauranga', 'Dunedin', 'Hamilton'], AU: ['Bondi', 'Surry Hills', 'Manly', 'Fitzroy', 'St Kilda', 'Newtown', 'Brisbane', 'Perth'], GB: ['Manchester', 'Bristol', 'Leeds', 'Brighton', 'Edinburgh', 'Glasgow', 'Sheffield', 'Cardiff'], IE: ['Dublin', 'Cork', 'Galway', 'Limerick'], ZA: ['Cape Town', 'Johannesburg', 'Durban'], US: ['Brooklyn', 'Austin', 'Portland', 'Chicago'], CA: ['Toronto', 'Vancouver'], FR: ['Paris', 'Lyon'] };
const UNIS: Record<string, string[]> = { NZ: ['University of Auckland', 'Victoria Wellington', 'Otago', 'Canterbury', 'AUT'], AU: ['UNSW', 'University of Sydney', 'Melbourne', 'UTS', 'RMIT', 'UQ'], GB: ['Leeds', 'Manchester', 'Bristol', 'Edinburgh', 'Nottingham', 'KCL'], IE: ['Trinity Dublin', 'UCD', 'UCC'], ZA: ['UCT', 'Stellenbosch'], US: ['NYU', 'UT Austin'], CA: ['UBC', 'Toronto'], FR: ['Sorbonne', 'Sciences Po'] };
/** name, lat, lng, nationality affinity, weekly whole-place rent baseline (£) */
export const AREAS: [string, number, number, string[], number][] = [
  ['Hackney', 51.545, -0.055, ['NZ', 'AU'], 340], ['Dalston', 51.546, -0.075, ['NZ', 'AU'], 330], ['Clapham', 51.462, -0.138, ['AU', 'ZA', 'IE'], 360], ['Tooting', 51.427, -0.168, ['IE', 'AU'], 300],
  ['Brixton', 51.462, -0.115, ['GB', 'AU'], 320], ['Peckham', 51.474, -0.069, ['GB', 'NZ'], 300], ['Shoreditch', 51.526, -0.078, ['NZ', 'US', 'FR'], 400], ['Islington', 51.536, -0.103, ['GB', 'IE'], 380],
  ['Finsbury Park', 51.565, -0.107, ['AU', 'GB'], 310], ['Balham', 51.443, -0.152, ['AU', 'ZA'], 320], ['Fulham', 51.480, -0.195, ['ZA', 'AU'], 390], ['Bermondsey', 51.498, -0.064, ['GB', 'US'], 350],
  ['Stoke Newington', 51.562, -0.074, ['NZ', 'GB'], 330], ['Camberwell', 51.474, -0.092, ['GB', 'IE'], 300],
];
const GYMS = ['bouldering at Blok Shoreditch', 'Barry’s Bootcamp', 'parkrun Hackney Marshes', 'Frame Shoreditch', 'hot yoga at Fierce Grace', 'Brockwell Lido swims', 'Brixton Rec climbing', '5-a-side at Powerleague', 'run club at Tracksmith', 'Peckham Levels pottery', 'Hampstead ponds', 'tennis at Clissold Park'];
const WORK = ['nursing', 'design', 'marketing', 'teaching', 'software', 'law', 'recruitment', 'physio', 'architecture', 'finance', 'hospitality', 'media'];
/** key, label, day since launch */
const EVENTS: [string, string, number][] = [['event:launch-jul', 'the launch drinks in July', 0], ['event:dalston-picnic-aug', 'the Dalston picnic in August', 40], ['event:clapham-run-sep', 'the Clapham run in September', 70], ['event:xmas-party-dec', 'the Christmas party', 150], ['event:brockwell-jan', 'the Brockwell lido swim in January', 190], ['event:pancakes-feb', 'pancake night in February', 220], ['event:hackney-fair-mar', 'the Hackney fair in March', 250], ['event:pub-quiz-apr', 'the pub quiz in April', 280], ['event:common-may', 'the Clapham Common picnic in May', 310], ['event:summer-party-jun', 'the summer party in June', 340], ['event:anniversary-jul', 'the one-year party', 365]];
const F = ['Maia', 'Nina', 'Sophie', 'Amy', 'Katelin', 'Danica', 'Priya', 'Lena', 'Grace', 'Gillian', 'Tess', 'Aroha', 'Bella', 'Chloe', 'Emma', 'Hannah', 'Isla', 'Jess', 'Kate', 'Lucy', 'Molly', 'Niamh', 'Olivia', 'Poppy', 'Ruby', 'Saoirse', 'Zoe', 'Ella', 'Freya', 'Georgia', 'Holly', 'Imogen', 'Jade', 'Keira', 'Lauren', 'Megan', 'Aoife', 'Ciara', 'Orla', 'Siobhan', 'Thandi', 'Lerato', 'Zanele', 'Anika', 'Mei', 'Priyanka', 'Sana', 'Yasmin', 'Rosa', 'Ines'];
const M = ['Nate', 'Ollie', 'Theo', 'Daniel', 'Liam', 'Callum', 'Finn', 'Jack', 'Harry', 'Oscar', 'Tom', 'Kai', 'Rory', 'Cian', 'Sipho', 'Luca', 'Max', 'Ben', 'Josh', 'Alex', 'Ryan'];
const SUR = ['Walker', 'Thompson', 'Kelly', 'Ngata', 'Murphy', 'Byrne', 'Patel', 'Chen', 'Nguyen', 'Smith', 'Taylor', 'Brown', 'Wilson', 'Hughes', 'Mitchell', 'Parata', 'O’Brien', 'Naidoo', 'van der Merwe', 'Reid', 'Fraser', 'Campbell', 'Moore', 'King', 'Scott', 'Harris', 'Bennett', 'Clarke', 'Edwards', 'Cooper'];
const REVIEWS = ['left the place spotless and watered every plant', 'was easy, tidy and messaged before arriving', 'treated the flat like her own; the neighbours loved her', 'quiet, considerate, left a thank-you note and fresh flowers', 'kept the place immaculate and even fixed the wobbly shelf', 'lovely guest, one late-night return but nothing else to say', 'perfect. Would hand her the keys again tomorrow', 'respectful of the flatmate, cleaned before leaving'];
const TINTS = ['#C98A6B', '#5B7DB1', '#B15B93', '#C15B5B', '#7BAE8E', '#4E7C8A', '#A6863F', '#5E8C61', '#9B6BB1', '#B1885B', '#5BA0B1', '#6B8CB1'];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function generateWorld(opts: SeedOptions = {}): SeedWorld {
  const N = opts.members ?? 5000, DAYS = opts.days ?? 420, HOST_SHARE = opts.hostShare ?? 0.16, MATCHES = opts.matches ?? 2300;
  const R = rng(opts.seed ?? 20260917);
  const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)];
  const weighted = <T,>(pairs: [T, number][]) => { const tot = pairs.reduce((s, p) => s + p[1], 0); let x = R() * tot; for (const [v, w] of pairs) { x -= w; if (x <= 0) return v; } return pairs[pairs.length - 1][0]; };
  const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  // Growth: 100 founding members before launch, then cumulative ∝ t^(1/0.62) → 5,000 by ~day 415.
  const joinDayFor = (i: number) => (i < 100 ? Math.floor(R() * 30) - 30 : Math.round(30 + (DAYS - 30) * Math.pow(i / N, 0.62)));

  const members: SeedMember[] = []; const invitesMade = new Map<string, number>(); const inviterOf = new Map<string, string>();
  for (let i = 0; i < N; i++) {
    const country = i === 0 ? 'NZ' : weighted(COUNTRIES);
    const female = i === 0 ? false : R() < 0.8;
    const name = `${i === 0 ? 'Toby' : pick(female ? F : M)} ${pick(SUR)}`;
    const age = Math.max(21, Math.min(41, Math.round(27.5 + gauss() * 3.2)));
    const areaIndex = weighted(AREAS.map((a, idx) => [idx, a[3].includes(country) ? 4 : 1] as [number, number]));
    const gradYear = 2026 - (age - 21) - Math.floor(R() * 2);
    const traits: Trait[] = [
      { kind: 'origin', key: `origin:${country.toLowerCase()}:${slug(pick(ORIGINS[country]))}`, label: '', provenance: 'self_declared' },
      { kind: 'education', key: `uni:${slug(pick(UNIS[country]))}:${gradYear}`, label: '', provenance: 'self_declared' },
    ];
    if (R() < 0.75) traits.push({ kind: 'interest', key: `gym:${slug(pick(GYMS))}`, label: '', provenance: 'self_declared' });
    if (R() < 0.35) traits.push({ kind: 'interest', key: `gym:${slug(pick(GYMS))}`, label: '', provenance: 'self_declared' });
    if (R() < 0.85) traits.push({ kind: 'work', key: `work:${pick(WORK)}`, label: '', provenance: 'self_declared' });
    for (const t of traits) t.label = labelFor(t.key);
    members.push({ id: `m${i}`, name, country, avatarColor: pick(TINTS), traits, female, age, areaIndex, joinDay: joinDayFor(i) });
    invitesMade.set(`m${i}`, 0);
  }

  // Invite tree. Founding 100: Toby's coffees. Everyone after: preferential attachment
  // (1+invites)^0.7 × 3 if same area × 2.2 if same country. Produces hubs (top inviter ~100)
  // and a long tail (~60% never invite anyone), which is what real referral trees look like.
  const vouches: SeedVouch[] = [];
  for (let i = 1; i < N; i++) {
    const m = members[i]; let inviter: SeedMember;
    if (i < 100) inviter = members[0];
    else {
      const cands: [SeedMember, number][] = [];
      for (let k = 0; k < 40; k++) { const c = members[Math.floor(R() * i)]; cands.push([c, Math.pow(1 + invitesMade.get(c.id)!, 0.7) * (c.areaIndex === m.areaIndex ? 3 : 1) * (c.country === m.country ? 2.2 : 1) * (c.id === 'm0' ? 0.05 : 1)]); }
      inviter = weighted(cands);
    }
    inviterOf.set(m.id, inviter.id); invitesMade.set(inviter.id, invitesMade.get(inviter.id)! + 1);
    vouches.push({ from: inviter.id, to: m.id, kind: 'invite', day: m.joinDay, consentToDisplay: true });
  }

  // Events: ~6% of eligible members attend; each meets two others → inferred-provenance trait + event vouch.
  for (const [key, label, day] of EVENTS) {
    const goers = members.filter((m) => m.joinDay <= day && R() < 0.06);
    for (const g of goers) g.traits.push({ kind: 'event', key, label, provenance: 'inferred' });
    for (const g of goers) for (let k = 0; k < 2; k++) { const o = pick(goers); if (o.id !== g.id) vouches.push({ from: g.id, to: o.id, kind: 'event', day, sharedEvents: 1 }); }
  }

  // Friendships: 0–3 per member, local/same-country biased.
  for (const m of members) {
    const n = weighted<number>([[0, 25], [1, 35], [2, 25], [3, 15]]);
    for (let k = 0; k < n; k++) { let o = m; for (let t = 0; t < 6; t++) { o = pick(members); if (o.id !== m.id && (o.areaIndex === m.areaIndex || o.country === m.country || R() < 0.15)) break; } if (o.id !== m.id) vouches.push({ from: m.id, to: o.id, kind: 'friend', day: Math.max(m.joinDay, o.joinDay) + Math.floor(R() * 30) }); }
  }

  // Listings: 16% host; 70% rooms; weekly rent = area baseline × (0.78 room | 1.35 whole) ± noise,
  // then expressed per night because that is the unit Kiki's app prices in.
  const listings: Listing[] = [];
  for (const m of members) {
    if (R() >= HOST_SHARE) continue;
    const a = AREAS[m.areaIndex]; const room = R() < 0.7;
    const weekly = Math.max(175, Math.round((a[4] * (room ? 0.78 : 1.35) + gauss() * 25) / 5) * 5);
    listings.push({ id: `l-${m.id}`, hostId: m.id, title: `${m.name.split(' ')[0]}’s ${room ? 'Room' : 'Place'}`, area: `${a[0]}, London`, kind: room ? 'Room' : 'Whole place', lat: a[1] + gauss() * 0.006, lng: a[2] + gauss() * 0.009, pricePerNight: Math.round(weekly / 7), photoColor: m.avatarColor, tags: [] });
  }

  // Absences: 1–3 per host, 2–8 weeks, 35% Christmas/January (Kiwi + Aussie summer), 25% August.
  const absences: Absence[] = [];
  const seasonal = () => { const r = R(); if (r < 0.35) return 140 + Math.floor(R() * 50); if (r < 0.6) return 370 + Math.floor(R() * 40); return Math.floor(R() * DAYS + 60); };
  for (const l of listings) { const n = weighted<number>([[1, 45], [2, 35], [3, 20]]); for (let k = 0; k < n; k++) absences.push({ listingId: l.id, hostId: l.hostId, start: seasonal(), weeks: weighted<number>([[2, 30], [3, 25], [4, 20], [6, 15], [8, 10]]) }); }

  // Matches: guest drawn from 2 steps (72%) or 3 steps of the host. Each completed match adds a
  // 'stay' vouch (host→guest, stays:1) and, 80% of the time, a guest-book entry about the guest.
  const adj = new Map<string, Set<string>>(members.map((m) => [m.id, new Set<string>()]));
  const link = (a: string, b: string) => { if (a !== b) { adj.get(a)!.add(b); adj.get(b)!.add(a); } };
  for (const v of vouches) link(v.from, v.to);
  const bfs = (src: string, maxD: number) => { const dist = new Map<string, number>([[src, 0]]); const q = [src]; for (let h = 0; h < q.length; h++) { const c = q[h]; const d = dist.get(c)!; if (d >= maxD) continue; for (const n of adj.get(c)!) if (!dist.has(n)) { dist.set(n, d + 1); q.push(n); } } return dist; };
  const absByHost = new Map<string, Absence[]>(); for (const a of absences) (absByHost.get(a.hostId) ?? absByHost.set(a.hostId, []).get(a.hostId)!).push(a);
  const hosts = [...absByHost.keys()]; const byId = new Map(members.map((m) => [m.id, m]));
  const matches: Match[] = []; const guestReviews: GuestReview[] = [];
  for (let attempts = 0; matches.length < MATCHES && attempts < MATCHES * 10; attempts++) {
    const hostId = pick(hosts); const dist = bfs(hostId, 3);
    const p2: string[] = [], p3: string[] = []; for (const [id, d] of dist) (d === 2 ? p2 : d === 3 ? p3 : []).push(id);
    const guestId = R() < 0.72 && p2.length ? pick(p2) : p3.length ? pick(p3) : null; if (!guestId) continue;
    const abs = pick(absByHost.get(hostId)!); if (abs.start > DAYS - 7) continue;
    const id = `x${matches.length}`; matches.push({ id, hostId, guestId, listingId: abs.listingId, start: abs.start, weeks: abs.weeks });
    vouches.push({ from: hostId, to: guestId, kind: 'stay', day: abs.start + abs.weeks * 7, stays: 1, consentToDisplay: true }); link(hostId, guestId);
    if (R() < 0.8) guestReviews.push({ id: `gr${id}`, subjectId: guestId, authorId: hostId, text: `${byId.get(guestId)!.name.split(' ')[0]} ${pick(REVIEWS)}.`, day: abs.start + abs.weeks * 7 + 2 });
  }
  return { members, vouches, listings, absences, matches, guestReviews, inviterOf };
}

function labelFor(key: string): string {
  const [kind, ...rest] = key.split(':');
  const words = (s: string) => s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (kind === 'origin') return words(rest[1]);
  if (kind === 'uni') return `${words(rest[0])}, ${rest[1]}`;
  if (kind === 'gym') return words(rest[0]).toLowerCase();
  if (kind === 'work') return rest[0];
  return key;
}

/** Reach statistics for a viewer — what the graph spec is built on. counts[d] = members at d steps; the last slot is "further". */
export function reachFrom(world: SeedWorld, viewerId: string, maxD = 6) {
  const adj = new Map<string, Set<string>>(world.members.map((m) => [m.id, new Set<string>()]));
  for (const v of world.vouches) if (v.from !== v.to) { adj.get(v.from)!.add(v.to); adj.get(v.to)!.add(v.from); }
  const dist = new Map<string, number>([[viewerId, 0]]); const q = [viewerId];
  for (let h = 0; h < q.length; h++) { const c = q[h]; const d = dist.get(c)!; if (d >= maxD) continue; for (const n of adj.get(c)!) if (!dist.has(n)) { dist.set(n, d + 1); q.push(n); } }
  const counts = new Array(maxD + 2).fill(0); for (const [id, d] of dist) if (id !== viewerId) counts[d]++;
  counts[maxD + 1] = world.members.length - 1 - counts.slice(0, maxD + 1).reduce((a, b) => a + b, 0);
  return { counts, dist };
}

/** The headline numbers, measured over `sample` random viewers: degree distribution and how much of the club sits at each step. */
export function worldStats(world: SeedWorld, sample = 200, seed = 7) {
  const R = rng(seed);
  const degree = new Map<string, number>(world.members.map((m) => [m.id, 0]));
  for (const v of world.vouches) if (v.from !== v.to) { degree.set(v.from, degree.get(v.from)! + 1); degree.set(v.to, degree.get(v.to)! + 1); }
  const degs = [...degree.values()].sort((a, b) => a - b);
  const q = (p: number) => degs[Math.min(degs.length - 1, Math.floor(p * degs.length))];
  const hosts = new Set(world.listings.map((l) => l.hostId));
  const sums = [0, 0, 0, 0, 0]; let hostsWithin2 = 0;
  for (let i = 0; i < sample; i++) {
    const viewer = world.members[Math.floor(R() * world.members.length)].id;
    const { counts, dist } = reachFrom(world, viewer, 4);
    const total = world.members.length - 1;
    sums[0] += counts[1] / total; sums[1] += counts[2] / total; sums[2] += counts[3] / total; sums[3] += counts[4] / total; sums[4] += (total - counts[1] - counts[2] - counts[3] - counts[4]) / total;
    for (const [id, d] of dist) if (d >= 1 && d <= 2 && hosts.has(id)) hostsWithin2++;
  }
  const pct = (x: number) => Math.round((x / sample) * 1000) / 10;
  return {
    members: world.members.length, vouches: world.vouches.length, listings: world.listings.length, matches: world.matches.length, guestReviews: world.guestReviews.length,
    degree: { min: degs[0], p25: q(0.25), median: q(0.5), p75: q(0.75), p95: q(0.95), max: degs[degs.length - 1] },
    reachPctBySteps: { d1: pct(sums[0]), d2: pct(sums[1]), d3: pct(sums[2]), d4: pct(sums[3]), d5plus: pct(sums[4]) },
    hostsWithin2StepsPct: Math.round((hostsWithin2 / sample / hosts.size) * 1000) / 10,
  };
}

// Measured on seed 20260917, 5,000 members, 15,930 vouches:
//   median degree 5 (p95 14, max 111 = Toby)
//   share of members at 1 / 2 / 3 / 4 / 5+ steps from a random viewer: 0.1 / 0.9 / 6.6 / 29.9 / 62.5 %
//   hosts within two steps of a random viewer: 1.4% (≈ 11 of 826)
//   independent two-step routes to a two-step host: 1.00 on average (a second route is rare)
// With ~10 imported social connections per member (Instagram mutuals) median degree becomes 25,
// 11% of members and ~98 hosts sit within two steps, 83% within three. That import is the
// difference between a graph that can introduce people and one that mostly can't.
