import { describe, expect, it } from 'vitest';
import { scoreMember, standings, tierOf, type Contribution } from '../tiering';

const c = (kind: Contribution['kind'], day: number, memberId = 'm'): Contribution => ({ memberId, kind, day });

describe('scoreMember', () => {
  it('weights high-value acts above low-value ones', () => {
    const hosted = scoreMember([c('hosted', 100)], 100);
    const reviewed = scoreMember([c('reviewed', 100)], 100);
    expect(hosted).toBeGreaterThan(reviewed);
  });

  it('decays older contributions (recency matters)', () => {
    const recent = scoreMember([c('hosted', 100)], 100, 120);
    const old = scoreMember([c('hosted', 100)], 100 + 240, 120); // 2 half-lives later
    expect(old).toBeLessThan(recent);
    expect(old / recent).toBeCloseTo(0.25, 1); // two half-lives ≈ quarter the value
  });

  it('is zero for no contributions', () => {
    expect(scoreMember([], 100)).toBe(0);
  });
});

describe('tierOf', () => {
  it('maps scores to the right tier', () => {
    expect(tierOf(0)).toBe('Newcomer');
    expect(tierOf(3)).toBe('Newcomer');
    expect(tierOf(8)).toBe('Trusted');
    expect(tierOf(15)).toBe('Pillar');
    expect(tierOf(30)).toBe('Legend');
  });
});

describe('standings', () => {
  it('ranks the cohort and puts the top member at the 100th percentile', () => {
    const map = new Map<string, Contribution[]>([
      ['top', [c('hosted', 100, 'top'), c('hosted', 100, 'top'), c('referred', 100, 'top')]],
      ['mid', [c('vouched', 100, 'mid')]],
      ['low', [c('reviewed', 50, 'low')]],
    ]);
    const s = standings(map, 100);
    expect(s[0].memberId).toBe('top');
    expect(s[0].rank).toBe(1);
    expect(s[0].percentile).toBe(100);
    expect(s.map((x) => x.score)).toEqual([...s.map((x) => x.score)].sort((a, b) => b - a));
  });

  it('gives a lone member the 100th percentile', () => {
    const s = standings(new Map([['solo', [c('hosted', 100, 'solo')]]]), 100);
    expect(s[0].percentile).toBe(100);
  });
});
