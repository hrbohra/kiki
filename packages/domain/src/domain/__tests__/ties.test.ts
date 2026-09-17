import { describe, it, expect } from 'vitest';
import { tieWeight, tieReason, rankRoutes, nextRingCount } from '../ties';
import { buildGraph } from '../graph';
import type { Member, Vouch } from '../types';

const m = (id: string): Member => ({ id, name: id, country: 'GB', avatarColor: '#000', traits: [] });

describe('tie weight', () => {
  it('is measured from stays, events and how the tie came to exist', () => {
    expect(tieWeight({ from: 'a', to: 'b', stays: 2, sharedEvents: 1 }).raw).toBe(5);
    expect(tieWeight({ from: 'a', to: 'b', kind: 'invite' }).raw).toBe(1.5);
    expect(tieWeight({ from: 'a', to: 'b', kind: 'friend' }).raw).toBe(1);
  });
  it('maps weight to the three-bar meter with the spec thresholds', () => {
    expect(tieWeight({ from: 'a', to: 'b', stays: 2 }).strength).toBe(3); // 4
    expect(tieWeight({ from: 'a', to: 'b', stays: 1 }).strength).toBe(2); // 2
    expect(tieWeight({ from: 'a', to: 'b', sharedEvents: 1 }).strength).toBe(1); // 1
  });
  it('decays with an 18-month half-life, and a bare tie is dashed rather than hidden', () => {
    const fresh = tieWeight({ from: 'a', to: 'b', stays: 2, day: 400 }, 400);
    const old = tieWeight({ from: 'a', to: 'b', stays: 2, day: 400 - 18 * 30 }, 400);
    expect(old.w).toBeCloseTo(fresh.w / 2, 5);
    expect(tieWeight({ from: 'a', to: 'b' }).dashed).toBe(true);
    expect(tieWeight(undefined).dashed).toBe(true);
  });
  it('says the fact, not the number', () => {
    expect(tieReason({ from: 'a', to: 'b', stays: 2, sharedEvents: 1 })).toBe('Has stayed with you 2 times. One Kiki event together.');
    expect(tieReason({ from: 'a', to: 'b', kind: 'invite' })).toBe('You brought them into Kiki.');
    expect(tieReason(undefined)).toBe('A direct connection of yours.');
  });
});

describe('route ranking', () => {
  it('ranks by the weakest hop first, then the total', () => {
    const w: Record<string, number> = { 'you|nina': 4, 'nina|maia': 3, 'you|sophie': 1, 'sophie|maia': 5 };
    const weightOf = (a: string, b: string) => { const raw = w[`${a}|${b}`] ?? w[`${b}|${a}`] ?? 0; return { raw, w: raw, strength: (raw >= 3 ? 3 : raw >= 1.5 ? 2 : 1) as 1 | 2 | 3, dashed: raw === 0 }; };
    const ranked = rankRoutes([['you', 'sophie', 'maia'], ['you', 'nina', 'maia']], weightOf);
    expect(ranked[0].ids).toEqual(['you', 'nina', 'maia']); // min 3 beats min 1, even though 1+5 > 4+3
    expect(ranked[0].min).toBe(3);
    expect(ranked[1].dashed).toEqual([false, false]);
  });
});

describe('next ring', () => {
  it('counts the people who know the host that the viewer does not', () => {
    const vouches: Vouch[] = [
      { from: 'you', to: 'nina' }, { from: 'nina', to: 'maia' }, { from: 'you', to: 'maia' },
      { from: 'maia', to: 'p1' }, { from: 'maia', to: 'p2' }, { from: 'maia', to: 'nina' },
    ];
    const g = buildGraph(['you', 'nina', 'maia', 'p1', 'p2'].map(m), vouches);
    expect(nextRingCount(g, 'you', 'maia')).toBe(2); // p1, p2 — nina is yours, you are you
  });
});
