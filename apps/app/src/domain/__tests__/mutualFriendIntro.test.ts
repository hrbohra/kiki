import { describe, expect, it } from 'vitest';

import { composeMutualFriendIntro, mutualFriendPrompt } from '../mutualFriendIntro';
import * as world from '../../world';

// Maia is the warm, two-route host; Danica is direct; Priya is the no-overlap cold case.
describe('composeMutualFriendIntro', () => {
  it('leads with shared ground, then mutuals, then the vouch anecdote (warm)', () => {
    const intro = composeMutualFriendIntro(world.trustStoryFor('emma'));
    expect(intro.greeting).toContain('Maia');
    // shared ground first
    expect(intro.paragraph).toMatch(/^You both /);
    // mutuals named
    expect(intro.paragraph).toMatch(/mutual friend/);
    // a real vouch quote is woven in
    expect(intro.parts.some((p) => p.kind === 'anecdote')).toBe(true);
    // never invents: every part traces to real data
    expect(intro.parts.length).toBeGreaterThan(0);
  });

  it('answers all four host anxieties for a well-evidenced warm host', () => {
    const intro = composeMutualFriendIntro(world.trustStoryFor('emma'));
    expect(intro.anxieties).toHaveLength(4);
    expect(intro.anxieties.every((a) => a.covered)).toBe(true);
  });

  it('is honest for the no-overlap cold host (some anxieties uncovered)', () => {
    const intro = composeMutualFriendIntro(world.trustStoryFor('priya'));
    expect(intro.paragraph).toMatch(/Nobody you know has met|new to your circle/);
    expect(intro.anxieties.some((a) => !a.covered)).toBe(true);
  });

  it('recognises a direct connection without inventing mutuals', () => {
    const intro = composeMutualFriendIntro(world.trustStoryFor('danica'));
    expect(intro.paragraph).toMatch(/already know Danica yourself/);
  });

  it('builds a model prompt that only carries real facts', () => {
    const prompt = mutualFriendPrompt(world.trustStoryFor('emma'));
    expect(prompt).toContain('only use these');
    expect(prompt).toContain('Maia');
    expect(prompt).toContain('Never invent facts');
  });
});
