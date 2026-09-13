import type { Member, Overlap, Trait, TraitKind } from './types';

/**
 * Surface the overlaps between two members — the "reads between the lines" step.
 *
 * The prototype matches on canonical trait keys (exact key equality). In production
 * this is where the LLM lives: it would read the two members' bios, photos and the
 * 10k Instagram conversations to propose fuzzy overlaps ("both into bouldering",
 * "friends with the same person"). Keeping it behind this one pure function means the
 * UI never changes when the matching gets smarter — only this implementation does.
 */
export function findOverlaps(viewer: Member, host: Member): Overlap[] {
  if (viewer.id === host.id) return [];

  const hostKeys = new Map(host.traits.map((t) => [t.key, t]));
  const overlaps: Overlap[] = [];

  for (const trait of viewer.traits) {
    const match = hostKeys.get(trait.key);
    if (!match) continue;
    // Provenance is the weaker of the two sides: if either typed it unverified, the overlap
    // is only as trustworthy as that. `inferred` (co-attendance) is treated as stronger here.
    const prov = weaker(trait.provenance, match.provenance);
    overlaps.push({ kind: trait.kind, label: phrase(trait.kind, trait.label), provenance: prov });
  }

  // Present the most trust-building overlaps first: shared origin and mutual context
  // land harder than a shared gym, so we rank by kind before returning.
  return overlaps.sort((a, b) => RANK[a.kind] - RANK[b.kind]);
}

/** Least-trustworthy of two provenances (self_declared < inferred < matched). */
function weaker(a: Trait['provenance'], b: Trait['provenance']): Overlap['provenance'] {
  const order = { self_declared: 0, inferred: 1, matched: 2 } as const;
  const av = order[a ?? 'self_declared'];
  const bv = order[b ?? 'self_declared'];
  return av <= bv ? a ?? 'self_declared' : b ?? 'self_declared';
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
