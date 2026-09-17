// Tie strength and route ranking — the graph spec made explicit.
//
// A tie's weight is measured, never guessed: stays and shared events you already record, plus
// what kind of tie it is (the invite that let someone in, a friendship), decayed by how long ago
// it was last active. The number is never shown; the sentence that produced it and a three-bar
// meter are. A number invites arguing; a fact invites a phone call.

import type { TrustGraph } from './graph';
import type { TieInfo, Vouch } from './types';

export interface TieWeight {
  /** Undecayed evidence: 2·stays + 1·sharedEvents + 1.5·[invite] + 1·[friend]. */
  raw: number;
  /** raw · 0.5^(months since last contact / 18). */
  w: number;
  strength: 1 | 2 | 3;
  /** The tie exists but nothing is measured on it — drawn dashed, never hidden. */
  dashed: boolean;
}

const HALF_LIFE_MONTHS = 18;

export function tieWeight(v: Vouch | undefined, nowDay?: number): TieWeight {
  const stays = v?.stays ?? 0;
  const events = v?.sharedEvents ?? 0;
  const raw = 2 * stays + events + (v?.kind === 'invite' ? 1.5 : 0) + (v?.kind === 'friend' ? 1 : 0);
  const months = v?.day != null && nowDay != null ? Math.max(0, nowDay - v.day) / 30 : 0;
  const w = raw * Math.pow(0.5, months / HALF_LIFE_MONTHS);
  const strength: 1 | 2 | 3 = w >= 3 ? 3 : w >= 1.5 ? 2 : 1;
  return { raw, w, strength, dashed: raw === 0 };
}

/** The sentence behind the meter. Facts only, in the order a friend would say them. */
export function tieReason(v: Vouch | undefined): string {
  const stays = v?.stays ?? 0;
  const events = v?.sharedEvents ?? 0;
  const parts: string[] = [];
  if (v?.kind === 'invite') parts.push('You brought them into Kiki.');
  if (v?.kind === 'friend') parts.push('A friend of yours.');
  if (stays > 0) parts.push(`Has stayed with you ${stays === 1 ? 'once' : `${stays} times`}.`);
  if (events > 0) parts.push(events === 1 ? 'One Kiki event together.' : `${events} Kiki events together.`);
  if (!parts.length) parts.push('A direct connection of yours.');
  return parts.join(' ');
}

export function tieInfo(v: Vouch | undefined, nowDay?: number): TieInfo {
  return { strength: tieWeight(v, nowDay).strength, reason: tieReason(v) };
}

export interface RankedRoute {
  ids: string[]; // viewer … host
  weights: number[]; // one per hop
  strengths: (1 | 2 | 3)[];
  dashed: boolean[];
  /** A chain is as strong as its weakest hop. */
  min: number;
  sum: number;
}

/**
 * Rank routes lexicographically by (weakest hop, then total): among equally short routes, the one
 * whose thinnest link is thickest comes first. Deterministic: ties keep input order.
 */
export function rankRoutes(routes: string[][], weightOf: (a: string, b: string) => TieWeight): RankedRoute[] {
  const scored = routes.map((ids) => {
    const hops = ids.slice(1).map((id, i) => weightOf(ids[i], id));
    const weights = hops.map((h) => h.w);
    return {
      ids,
      weights,
      strengths: hops.map((h) => h.strength),
      dashed: hops.map((h) => h.dashed),
      min: weights.length ? Math.min(...weights) : 0,
      sum: weights.reduce((a, b) => a + b, 0),
    };
  });
  return scored.sort((a, b) => b.min - a.min || b.sum - a.sum);
}

/** How many people know the host that the viewer doesn't — the host's next ring, shown as a count before it is ever drawn. */
export function nextRingCount(graph: TrustGraph, viewerId: string, hostId: string): number {
  const mine = new Set(graph.neighbours.get(viewerId) ?? []);
  mine.add(viewerId);
  return (graph.neighbours.get(hostId) ?? []).filter((id) => !mine.has(id)).length;
}
