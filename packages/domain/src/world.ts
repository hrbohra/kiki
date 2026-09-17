// Composition root: wires the pure domain model to the pipeline results and exposes
// ready-to-render selectors. Screens import from here and never re-run algorithms themselves.
//
// `createWorld(data)` makes the composition data-source-agnostic: the apps use the default
// instance bound to the bundled demo fixtures, while the API builds a World from Postgres rows.
// The single set of selectors (trust story, listings, standings, overlaps) is therefore shared
// verbatim between the demo and the real backend.

import { buildGraph, allShortestPaths, pairKey, type TrustGraph } from './domain/graph';
import { buildConnectionStory } from './domain/connection';
import { findOverlaps } from './domain/similarity';
import { tieInfo, tieWeight, rankRoutes, nextRingCount } from './domain/ties';
import {
  members as fxMembers,
  vouches as fxVouches,
  listings as fxListings,
  reviews as fxReviews,
  guestReviews as fxGuestReviews,
  contributions as fxContributions,
  WORLD_NOW_DAY,
  VIEWER_ID,
} from './domain/fixtures';
import type {
  ConnectionStory,
  Contribution,
  GuestReview,
  Listing,
  Member,
  Overlap,
  Review,
  TieInfo,
  TrustStory,
  RouteView,
  Vouch,
  VouchChannel,
} from './domain/types';
import { aggregateGuestBook, type HostGuestBook } from './pipeline/nlp';
import { standings, type MemberStanding } from './pipeline/tiering';

/** Everything a World needs — the persisted entities plus the "now" clock and the viewer. */
export interface WorldData {
  members: Member[];
  vouches: Vouch[];
  listings: Listing[];
  reviews: Review[];
  guestReviews: GuestReview[];
  contributions: Contribution[];
  nowDay: number;
  viewerId: string;
}

/** The read model + selectors, computed from one graph and one guest-book roll-up. */
export interface World {
  viewerId: string;
  graph: TrustGraph;
  memberById(id: string): Member;
  allListings(): Listing[];
  listingById(id: string): Listing;
  hostOf(listing: Listing): Member;
  listingForHost(memberId: string): Listing | undefined;
  storyFor(hostId: string): ConnectionStory;
  degreeToHost(hostId: string): number;
  guestBookOf(hostId: string): { reviews: Review[]; summary: HostGuestBook };
  standingOf(memberId: string): MemberStanding;
  leaderboard(): MemberStanding[];
  viewerFriendNames(exclude?: string[]): string[];
  peopleLikeYou(): { member: Member; overlaps: Overlap[] }[];
  trustStoryFor(hostId: string): TrustStory;
  /** The viewer's invite branch, depth 1: who they brought in, with what each has done since. */
  inviteBranch(): InviteBranchEntry[];
}

export interface InviteBranchEntry {
  member: Member;
  hosted: number;
  stays: number;
  invited: number; // people who came in through them
  tier: MemberStanding['tier'];
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

/** Build a World from any data source (fixtures or DB). Pure — no IO. */
export function createWorld(data: WorldData): World {
  const { members, vouches, listings, reviews, guestReviews, contributions, nowDay, viewerId } = data;

  const graph = buildGraph(members, vouches);
  const memberIndex = new Map(members.map((m) => [m.id, m]));
  const listingIndex = new Map(listings.map((l) => [l.id, l]));
  const reviewsByHost = groupBy(reviews, (r) => r.hostId);
  const contributionsByMember = groupBy(contributions, (c) => c.memberId);
  const standingList = standings(contributionsByMember, nowDay);
  const standingIndex = new Map(standingList.map((s) => [s.memberId, s]));
  // One vouch per unordered pair; the stored direction carries the note and tie data.
  const vouchIndex = new Map<string, Vouch>(vouches.map((v) => [pairKey(v.from, v.to), v]));

  function memberById(id: string): Member {
    const m = memberIndex.get(id);
    if (!m) throw new Error(`unknown member ${id}`);
    return m;
  }

  function allListings(): Listing[] {
    return listings;
  }

  function listingById(id: string): Listing {
    const l = listingIndex.get(id);
    if (!l) throw new Error(`unknown listing ${id}`);
    return l;
  }

  function hostOf(listing: Listing): Member {
    return memberById(listing.hostId);
  }

  function listingForHost(memberId: string): Listing | undefined {
    return listings.find((l) => l.hostId === memberId);
  }

  function storyFor(hostId: string): ConnectionStory {
    return buildConnectionStory(graph, viewerId, hostId);
  }

  function degreeToHost(hostId: string): number {
    return storyFor(hostId).degrees;
  }

  function guestBookOf(hostId: string): { reviews: Review[]; summary: HostGuestBook } {
    const list = reviewsByHost.get(hostId) ?? [];
    const ordered = [...list].sort((a, b) => b.day - a.day);
    return { reviews: ordered, summary: aggregateGuestBook(ordered.map((r) => r.text)) };
  }

  function standingOf(memberId: string): MemberStanding {
    return (
      standingIndex.get(memberId) ??
      { memberId, score: 0, tier: 'Newcomer', percentile: 0, rank: standingList.length + 1 }
    );
  }

  function leaderboard(): MemberStanding[] {
    return standingList;
  }

  function viewerFriendNames(exclude: string[] = []): string[] {
    const skip = new Set(exclude);
    return (graph.neighbours.get(viewerId) ?? [])
      .filter((id) => !skip.has(id))
      .map((id) => memberById(id).name);
  }

  function peopleLikeYou(): { member: Member; overlaps: Overlap[] }[] {
    const viewer = memberById(viewerId);
    return members
      .filter((m) => m.id !== viewerId)
      .map((m) => ({ member: m, overlaps: findOverlaps(viewer, m) }))
      .filter((x) => x.overlaps.length > 0)
      .sort((a, b) => b.overlaps.length - a.overlaps.length || a.member.name.localeCompare(b.member.name));
  }

  /** Measured tie strength (stays, events, how the tie came to exist, recency) — see ties.ts. */
  function tieOf(v: Vouch | undefined): TieInfo {
    return tieInfo(v, nowDay);
  }
  const weightBetween = (a: string, b: string) => tieWeight(vouchIndex.get(pairKey(a, b)), nowDay);

  function trustStoryFor(hostId: string): TrustStory {
    const host = memberById(hostId);
    const routeIds = allShortestPaths(graph, viewerId, hostId);
    const reachable = routeIds.length > 0;
    const degrees = reachable ? routeIds[0].length - 1 : Infinity;
    const routes = routeIds.map((ids) => ids.map(memberById));
    const rankedRoutes: RouteView[] = rankRoutes(routeIds, weightBetween).map((r) => ({ members: r.ids.map(memberById), strengths: r.strengths, dashed: r.dashed, min: r.min }));
    const overlaps = findOverlaps(memberById(viewerId), host);

    const channels: VouchChannel[] = [];
    const seen = new Set<string>();
    for (const ids of routeIds) {
      if (ids.length !== 3) continue;
      const mutualId = ids[1];
      if (seen.has(mutualId)) continue;
      seen.add(mutualId);
      const toHost = vouchIndex.get(pairKey(mutualId, hostId));
      if (toHost?.consentToDisplay !== true) continue;
      channels.push({
        voucher: memberById(mutualId),
        note: toHost.note,
        noteSubject: toHost.noteSubject,
        tie: tieOf(vouchIndex.get(pairKey(viewerId, mutualId))),
      });
    }
    const warm = channels.length > 0;

    const direct = reachable && degrees === 1;
    const directV = direct ? vouchIndex.get(pairKey(viewerId, hostId)) : undefined;
    const directLink = direct ? { note: directV?.note, tie: tieOf(directV) } : undefined;

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
      host,
      reachable,
      degrees,
      warm,
      direct,
      directLink,
      channels,
      routes,
      rankedRoutes,
      nextRingCount: reachable ? nextRingCount(graph, viewerId, hostId) : 0,
      overlaps,
      consentNames: channels.map((c) => c.voucher.name),
      inviter,
      guestTrackRecord,
    };
  }

  function inviteBranch(): InviteBranchEntry[] {
    const count = (id: string, kind: Contribution['kind']) => (contributionsByMember.get(id) ?? []).filter((c) => c.kind === kind).length;
    return vouches
      .filter((v) => v.kind === 'invite' && v.from === viewerId && memberIndex.has(v.to))
      .map((v) => ({
        member: memberById(v.to),
        hosted: count(v.to, 'hosted'),
        stays: count(v.to, 'stayed'),
        invited: vouches.filter((x) => x.kind === 'invite' && x.from === v.to).length,
        tier: standingOf(v.to).tier,
      }));
  }

  return {
    viewerId,
    graph,
    memberById,
    allListings,
    listingById,
    hostOf,
    listingForHost,
    storyFor,
    degreeToHost,
    guestBookOf,
    standingOf,
    leaderboard,
    viewerFriendNames,
    peopleLikeYou,
    trustStoryFor,
    inviteBranch,
  };
}

// Default instance bound to the bundled demo fixtures — preserves the original module API
// so existing screens and tests keep importing the named selectors unchanged.
const demo = createWorld({
  members: fxMembers,
  vouches: fxVouches,
  listings: fxListings,
  reviews: fxReviews,
  guestReviews: fxGuestReviews,
  contributions: fxContributions,
  nowDay: WORLD_NOW_DAY,
  viewerId: VIEWER_ID,
});

export const viewerId = demo.viewerId;
export const memberById = demo.memberById;
export const allListings = demo.allListings;
export const listingById = demo.listingById;
export const hostOf = demo.hostOf;
export const listingForHost = demo.listingForHost;
export const storyFor = demo.storyFor;
export const degreeToHost = demo.degreeToHost;
export const guestBookOf = demo.guestBookOf;
export const standingOf = demo.standingOf;
export const leaderboard = demo.leaderboard;
export const viewerFriendNames = demo.viewerFriendNames;
export const peopleLikeYou = demo.peopleLikeYou;
export const trustStoryFor = demo.trustStoryFor;
export const inviteBranch = demo.inviteBranch;

export type { Contribution };
