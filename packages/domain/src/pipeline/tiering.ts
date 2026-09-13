// Community tiering: turn a member's contribution history into a rank and a tier.
// Pure and deterministic — recency uses an injected `asOfDay` (integer day index) rather
// than the wall clock, so scores are reproducible and testable (no Date.now()).

import type { Contribution, ContributionKind } from '../domain/types';

export type { Contribution, ContributionKind };

/** Raw value of each contribution type before recency decay. */
const WEIGHT: Record<ContributionKind, number> = {
  hosted: 5,
  referred: 4,
  vouched: 3,
  attended: 2,
  reviewed: 1,
  stayed: 1,
};

export interface Tier {
  name: 'Newcomer' | 'Trusted' | 'Pillar' | 'Legend';
  min: number;
}

// Bands are calibrated to the decayed-score scale (a very active recent host lands
// in the low-to-mid teens), so the cohort spreads across tiers rather than bunching.
const TIERS: Tier[] = [
  { name: 'Legend', min: 25 },
  { name: 'Pillar', min: 12 },
  { name: 'Trusted', min: 5 },
  { name: 'Newcomer', min: 0 },
];

export interface MemberStanding {
  memberId: string;
  score: number;
  tier: Tier['name'];
  /** Percentile among all scored members, 0..100 (100 = top). */
  percentile: number;
  rank: number; // 1 = highest score
}

/**
 * Score = sum of weighted contributions, each decayed by how long ago it happened.
 * Recent, high-value acts (hosting last week) count for more than the same act a year
 * ago — trust is a living thing, so the score has to breathe.
 */
export function scoreMember(
  contributions: Contribution[],
  asOfDay: number,
  halfLifeDays = 120,
): number {
  let total = 0;
  for (const c of contributions) {
    const ageDays = Math.max(0, asOfDay - c.day);
    const decay = Math.pow(0.5, ageDays / halfLifeDays);
    total += WEIGHT[c.kind] * decay;
  }
  return round1(total);
}

export function tierOf(score: number): Tier['name'] {
  return TIERS.find((t) => score >= t.min)!.name;
}

/**
 * Rank every member against the cohort. Percentile is the share of members a person
 * scores at-or-above, so it reads as "top X%" in the UI.
 */
export function standings(
  contributionsByMember: Map<string, Contribution[]>,
  asOfDay: number,
  halfLifeDays = 120,
): MemberStanding[] {
  const scored = [...contributionsByMember.entries()].map(([memberId, cs]) => ({
    memberId,
    score: scoreMember(cs, asOfDay, halfLifeDays),
  }));

  scored.sort((a, b) => b.score - a.score || a.memberId.localeCompare(b.memberId));
  const n = scored.length;

  return scored.map((s, i) => ({
    memberId: s.memberId,
    score: s.score,
    tier: tierOf(s.score),
    rank: i + 1,
    // i=0 (top) -> 100; last -> ~ (1/n)*100. Guard n===1.
    percentile: n === 1 ? 100 : Math.round(((n - i) / n) * 100),
  }));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
