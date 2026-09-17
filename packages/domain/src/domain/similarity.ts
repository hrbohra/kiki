import type { Member, Overlap, Trait, TraitKind } from './types';
import { memberSignals, type SignalSource } from '../pipeline/textSignals';

/** The free text Kiki holds about a member: what they wrote, and what their guests and hosts wrote. */
export interface MemberTexts {
  bio?: string;
  guestBook?: string[];
}

/**
 * Surface the overlaps between two members — the "reads between the lines" step.
 *
 * Two passes, strongest evidence first:
 *  1. exact matches on typed profile facts (canonical trait keys), as before;
 *  2. shared TOPICS read out of bios and guest-book entries (pipeline/textSignals), which also
 *     catches fuzzy profile matches ("bouldering at Blok" vs "Brixton Rec climbing").
 *
 * Every overlap says where it came from, because an unsourced inference reads as surveillance.
 * Text-derived overlaps are phrased as what people MENTION, never as who they are, and always
 * rank below typed facts. This one pure function is still the only seam: an embedding model
 * replaces the lexicon behind textSignals without the UI changing.
 */
export function findOverlaps(viewer: Member, host: Member, texts?: { viewer?: MemberTexts; host?: MemberTexts }): Overlap[] {
  if (viewer.id === host.id) return [];

  const hostKeys = new Map(host.traits.map((t) => [t.key, t]));
  const overlaps: Overlap[] = [];

  for (const trait of viewer.traits) {
    const match = hostKeys.get(trait.key);
    if (!match) continue;
    // Provenance is the weaker of the two sides: if either typed it unverified, the overlap
    // is only as trustworthy as that. `inferred` (co-attendance) is treated as stronger here.
    const prov = weaker(trait.provenance, match.provenance);
    overlaps.push({ kind: trait.kind, label: phrase(trait.kind, trait.label), provenance: prov, source: 'profile' });
  }
  overlaps.sort((a, b) => RANK[a.kind] - RANK[b.kind]);

  // Pass 2 — topics. Skip any topic an exact overlap already covers, so nothing is said twice.
  const mine = memberSignals({ traitLabels: viewer.traits.map((t) => t.label), ...texts?.viewer });
  const theirs = memberSignals({ traitLabels: host.traits.map((t) => t.label), ...texts?.host });
  const covered = memberSignals({ traitLabels: overlaps.map((o) => o.label) });
  const topical: Overlap[] = [];
  for (const [key, a] of mine) {
    const b = theirs.get(key);
    if (!b || covered.has(key)) continue;
    const source = weakestSource(a.source, b.source);
    topical.push({
      kind: a.signal.kind,
      label: topicPhrase(a.signal.label, a.source, b.source, host.name.split(' ')[0]),
      // what guests wrote is inference about a person; what they wrote themselves is their own word
      provenance: source === 'guest_book' ? 'inferred' : 'self_declared',
      source,
    });
  }
  topical.sort((a, b) => RANK[a.kind] - RANK[b.kind]);

  return [...overlaps, ...topical];
}

/** Least-trustworthy of two provenances (self_declared < inferred < matched). */
function weaker(a: Trait['provenance'], b: Trait['provenance']): Overlap['provenance'] {
  const order = { self_declared: 0, inferred: 1, matched: 2 } as const;
  const av = order[a ?? 'self_declared'];
  const bv = order[b ?? 'self_declared'];
  return av <= bv ? a ?? 'self_declared' : b ?? 'self_declared';
}

/** The overlap is only as direct as its least direct side: profile > bio > guest book. */
function weakestSource(a: SignalSource, b: SignalSource): SignalSource {
  const order: Record<SignalSource, number> = { profile: 0, bio: 1, guest_book: 2 };
  return order[a] >= order[b] ? a : b;
}

function topicPhrase(label: string, mine: SignalSource, theirs: SignalSource, hostFirst: string): string {
  if (theirs === 'guest_book' && mine !== 'guest_book') return `You both mention ${label} — you in your own words, ${hostFirst} in what guests wrote`;
  if (mine === 'guest_book' && theirs !== 'guest_book') return `You both mention ${label} — ${hostFirst} in their own words, you in what guests wrote`;
  if (mine === 'guest_book' && theirs === 'guest_book') return `You both mention ${label} — it comes up in both your guest books`;
  return `You both mention ${label}`;
}

const RANK: Record<TraitKind, number> = {
  origin: 0,
  education: 1,
  work: 2,
  interest: 3,
  event: 4,
};

function phrase(kind: TraitKind, label: string): string {
  switch (kind) {
    case 'origin':
      return `You both moved to London from ${label}`;
    case 'education':
      return `You both studied at ${label}`;
    case 'work':
      return `You've both worked in ${label}`;
    case 'interest':
      return `You're both into ${label}`;
    case 'event':
      return `You were both at ${label}`;
  }
}
