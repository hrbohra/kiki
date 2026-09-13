// Composition root: the one place that wires the pure domain model to the pipeline
// results and exposes ready-to-render selectors to the screens. Screens import from
// here and never re-run algorithms themselves.

import { buildGraph, allShortestPaths, pairKey } from './domain/graph';
import { buildConnectionStory } from './domain/connection';
import { findOverlaps } from './domain/similarity';
import {
  members, vouches, listings, reviews, guestReviews, contributions, WORLD_NOW_DAY, VIEWER_ID,
} from './domain/fixtures';
import type { Contribution, Listing, Member, Overlap, Review, TieInfo, TrustStory, Vouch, VouchChannel } from './domain/types';
import { aggregateGuestBook, type HostGuestBook } from './pipeline/nlp';
import { standings, type MemberStanding } from './pipeline/tiering';

const graph = buildGraph(members, vouches);

const memberIndex = new Map(members.map((m) => [m.id, m]));
const listingIndex = new Map(listings.map((l) => [l.id, l]));

const reviewsByHost = groupBy(reviews, (r) => r.hostId);
const contributionsByMember = groupBy(contributions, (c) => c.memberId);

const standingList = standings(contributionsByMember, WORLD_NOW_DAY);
const standingIndex = new Map(standingList.map((s) => [s.memberId, s]));

export const viewerId = VIEWER_ID;

export function memberById(id: string): Member {
  const m = memberIndex.get(id);
  if (!m) throw new Error(`unknown member ${id}`);
  return m;
}

export function allListings(): Listing[] {
  return listings;
}

export function listingById(id: string): Listing {
  const l = listingIndex.get(id);
  if (!l) throw new Error(`unknown listing ${id}`);
  return l;
}

export function hostOf(listing: Listing): Member {
  return memberById(listing.hostId);
}

/** The listing a member hosts, if any (some members are guests only). */
export function listingForHost(memberId: string): Listing | undefined {
  return listings.find((l) => l.hostId === memberId);
}

/** The connection story from the viewer to a given host. */
export function storyFor(hostId: string) {
  return buildConnectionStory(graph, viewerId, hostId);
}

export function degreeToHost(hostId: string): number {
  return storyFor(hostId).degrees;
}

/** Guest-book NLP roll-up for a host (empty-safe). */
export function guestBookOf(hostId: string): { reviews: Review[]; summary: HostGuestBook } {
  const list = reviewsByHost.get(hostId) ?? [];
  const ordered = [...list].sort((a, b) => b.day - a.day);
  return { reviews: ordered, summary: aggregateGuestBook(ordered.map((r) => r.text)) };
}

/** Community standing for a member (Newcomer if they have no contributions yet). */
export function standingOf(memberId: string): MemberStanding {
  return (
    standingIndex.get(memberId) ?? { memberId, score: 0, tier: 'Newcomer', percentile: 0, rank: standingList.length + 1 }
  );
}

/** Whole cohort ranked by contribution, for the leaderboard. */
export function leaderboard(): MemberStanding[] {
  return standingList;
}

/** Names of the viewer's direct vouch connections (for graph branch texture). */
export function viewerFriendNames(exclude: string[] = []): string[] {
  const skip = new Set(exclude);
  return (graph.neighbours.get(viewerId) ?? [])
    .filter((id) => !skip.has(id))
    .map((id) => memberById(id).name);
}

/** People the viewer overlaps with, most-in-common first (for the similarity screen). */
export function peopleLikeYou(): { member: Member; overlaps: Overlap[] }[] {
  const viewer = memberById(viewerId);
  return members
    .filter((m) => m.id !== viewerId)
    .map((m) => ({ member: m, overlaps: findOverlaps(viewer, m) }))
    .filter((x) => x.overlaps.length > 0)
    .sort((a, b) => b.overlaps.length - a.overlaps.length || a.member.name.localeCompare(b.member.name));
}

// --- Trust tab ---------------------------------------------------------------
// One vouch per unordered pair; the stored direction (voucher→host, viewer→voucher) carries
// the note and the tie data respectively.
const vouchIndex = new Map<string, Vouch>(vouches.map((v) => [pairKey(v.from, v.to), v]));

function tieOf(v: Vouch | undefined): TieInfo {
  const stays = v?.stays ?? 0;
  const events = v?.sharedEvents ?? 0;
  const strength = Math.max(1, Math.min(3, stays + (events > 0 ? 1 : 0))) as 1 | 2 | 3;
  const reason = stays > 0
    ? `Has stayed with you ${stays === 1 ? 'once' : `${stays} times`}.`
    : events > 0
      ? 'One Kiki event together.'
      : 'A direct connection of yours.';
  return { strength, reason };
}

/**
 * Assemble the Trust tab's data for a host: the consenting vouching mutuals (warm), the full
 * set of shortest routes for the ring graph, shared facts with provenance, and — when there's
 * no mutual — the cold-state evidence (who invited them, their guest track record). Everything
 * derives from one graph + guest-book roll-up; nothing is passed in that the data can't back.
 */
export function trustStoryFor(hostId: string): TrustStory {
  const host = memberById(hostId);
  const routeIds = allShortestPaths(graph, viewerId, hostId);
  const reachable = routeIds.length > 0;
  const degrees = reachable ? routeIds[0].length - 1 : Infinity;
  const routes = routeIds.map((ids) => ids.map(memberById));
  const overlaps = findOverlaps(memberById(viewerId), host);

  // Consenting mutuals sit in the middle of a 2-hop route (viewer → mutual → host).
  const channels: VouchChannel[] = [];
  const seen = new Set<string>();
  for (const ids of routeIds) {
    if (ids.length !== 3) continue;
    const mutualId = ids[1];
    if (seen.has(mutualId)) continue;
    seen.add(mutualId);
    const toHost = vouchIndex.get(pairKey(mutualId, hostId));
    if (toHost?.consentToDisplay !== true) continue; // only shown with consent
    channels.push({
      voucher: memberById(mutualId),
      note: toHost.note,
      noteSubject: toHost.noteSubject,
      tie: tieOf(vouchIndex.get(pairKey(viewerId, mutualId))),
    });
  }
  const warm = channels.length > 0;

  // Direct: you're a first-degree connection — you don't need a mutual to vouch.
  const direct = reachable && degrees === 1;
  const directV = direct ? vouchIndex.get(pairKey(viewerId, hostId)) : undefined;
  const directLink = direct ? { note: directV?.note, tie: tieOf(directV) } : undefined;

  // Cold: who let them in (the host's predecessor on the shortest route), and how far off they are.
  let inviter: TrustStory['inviter'];
  if (!warm && !direct && reachable) {
    const ids = routeIds[0];
    const invId = ids[ids.length - 2];
    inviter = { member: memberById(invId), degrees: degreeToHost(invId) };
  }

  const isKnown = (id: string) => Number.isFinite(degreeToHost(id)) && degreeToHost(id) <= 2;
  const guestTrackRecord = guestReviews
    .filter((g) => g.subjectId === hostId)
    .sort((a, b) => b.day - a.day)
    .map((g) => ({ author: memberById(g.authorId), known: isKnown(g.authorId), text: g.text, day: g.day }));

  return {
    host, reachable, degrees, warm, direct, directLink, channels, routes, overlaps,
    consentNames: channels.map((c) => c.voucher.name),
    inviter, guestTrackRecord,
  };
}

function groupBy<T, K>(items: T[], key: (t: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
}

export type { Contribution };
