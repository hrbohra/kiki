import { describe, expect, it } from 'vitest';
import { buildGraph, pairKey, shortestPath, allShortestPaths } from '../graph';
import { buildConnectionStory, connectionStoryFrom } from '../connection';
import { findOverlaps } from '../similarity';
import { listings, members, vouches, VIEWER_ID } from '../fixtures';
import type { Member, Vouch } from '../types';

const byId = (id: string): Member => members.find((m) => m.id === id)!;

describe('shortestPath (BFS)', () => {
  const graph = buildGraph(members, vouches);

  it('returns the single node when source equals target', () => {
    expect(shortestPath(graph, VIEWER_ID, VIEWER_ID)).toEqual([VIEWER_ID]);
  });

  it('finds the fewest-intermediary chain, not just any chain', () => {
    // you->bella->emma and you->sophie->emma both exist (2 hops); a 3-hop chain
    // via amy also exists. BFS must return a 2-hop path, never the longer one.
    const path = shortestPath(graph, 'you', 'emma');
    expect(path).not.toBeNull();
    expect(path!.length).toBe(3); // [you, mutual, emma]
    expect(path![0]).toBe('you');
    expect(path![2]).toBe('emma');
    expect(['bella', 'sophie']).toContain(path![1]);
  });

  it('is deterministic across runs (sorted adjacency)', () => {
    const a = shortestPath(graph, 'you', 'emma');
    const b = shortestPath(graph, 'you', 'emma');
    expect(a).toEqual(b);
  });

  it('returns null when the host is unreachable', () => {
    const island: Member = { id: 'ghost', name: 'Ghost', country: 'GB', avatarColor: '#000', traits: [] };
    const g = buildGraph([...members, island], vouches);
    expect(shortestPath(g, 'you', 'ghost')).toBeNull();
  });

  it('returns null for unknown ids instead of throwing', () => {
    expect(shortestPath(graph, 'you', 'nobody')).toBeNull();
    expect(shortestPath(graph, 'nobody', 'emma')).toBeNull();
  });
});

describe('allShortestPaths', () => {
  const graph = buildGraph(members, vouches);

  it('finds BOTH independent 2-hop chains to Maia (via Nina and via Sophie)', () => {
    const paths = allShortestPaths(graph, 'you', 'emma');
    expect(paths.length).toBe(2);
    for (const p of paths) {
      expect(p.length).toBe(3);
      expect(p[0]).toBe('you');
      expect(p[2]).toBe('emma');
    }
    const mids = paths.map((p) => p[1]).sort();
    expect(mids).toEqual(['bella', 'sophie']);
  });

  it('returns the single node for source === target, and [] when unreachable', () => {
    expect(allShortestPaths(graph, 'you', 'you')).toEqual([['you']]);
    const g = buildGraph([...members, { id: 'ghost', name: 'G', country: 'GB', avatarColor: '#000', traits: [] }], vouches);
    expect(allShortestPaths(g, 'you', 'ghost')).toEqual([]);
  });

  it('respects the enumeration cap', () => {
    expect(allShortestPaths(graph, 'you', 'emma', 1).length).toBe(1);
  });
});

describe('buildGraph resilience', () => {
  it('ignores vouches that reference unknown members', () => {
    const dirty: Vouch[] = [...vouches, { from: 'you', to: 'does-not-exist' }];
    const g = buildGraph(members, dirty);
    expect(g.neighbours.get('you')).not.toContain('does-not-exist');
  });

  it('ignores self-vouches', () => {
    const g = buildGraph(members, [{ from: 'you', to: 'you' }]);
    expect(g.neighbours.get('you')).toEqual([]);
  });

  it('keys hop notes by unordered pair', () => {
    const g = buildGraph(members, vouches);
    expect(g.notes.get(pairKey('bella', 'emma'))).toContain('Iris');
    expect(g.notes.get(pairKey('emma', 'bella'))).toContain('Iris'); // same edge, either order
  });
});

describe('findOverlaps', () => {
  it('surfaces shared traits, origin ranked first, with provenance', () => {
    const overlaps = findOverlaps(byId('you'), byId('emma'));
    expect(overlaps.map((o) => o.kind)).toEqual(['origin', 'education', 'interest', 'event']);
    expect(overlaps[0].label).toMatch(/Mount Eden/);
    // co-attendance is inferred; a typed origin is self-declared
    expect(overlaps.find((o) => o.kind === 'event')!.provenance).toBe('inferred');
    expect(overlaps.find((o) => o.kind === 'origin')!.provenance).toBe('self_declared');
  });

  it('returns nothing when comparing a member to themselves', () => {
    expect(findOverlaps(byId('you'), byId('you'))).toEqual([]);
  });

  it('returns nothing when there is no overlap', () => {
    expect(findOverlaps(byId('you'), byId('ollie'))).toEqual([]);
  });
});

describe('buildConnectionStory (the one function the UI calls)', () => {
  const graph = buildGraph(members, vouches);

  it('assembles path, degrees, hop notes and overlaps for a reachable host', () => {
    const story = buildConnectionStory(graph, 'you', 'emma');
    expect(story.reachable).toBe(true);
    expect(story.degrees).toBe(2);
    expect(story.path[0].name).toBe('You');
    expect(story.path.at(-1)!.name).toBe('Maia');
    expect(story.overlaps.length).toBe(4);
    // a note sits on at least one hop of the chosen chain
    expect(story.hopNotes.some((n) => typeof n === 'string')).toBe(true);
  });

  it('still returns overlaps (but unreachable) for a host with no vouch chain', () => {
    const loner: Member = { id: 'loner', name: 'Lo', country: 'NZ', avatarColor: '#000',
      traits: byId('you').traits };
    const g = buildGraph([...members, loner], vouches);
    const story = buildConnectionStory(g, 'you', 'loner');
    expect(story.reachable).toBe(false);
    expect(story.degrees).toBe(Infinity);
    expect(story.overlaps.length).toBe(4); // shares your traits, just no chain yet
  });

  it('convenience wrapper matches the graph-based call', () => {
    const a = connectionStoryFrom(members, vouches, 'you', 'emma');
    const b = buildConnectionStory(graph, 'you', 'emma');
    expect(a).toEqual(b);
  });
});

describe('fixtures sanity', () => {
  it('every listing points at a real host', () => {
    for (const l of listings) {
      expect(members.some((m) => m.id === l.hostId)).toBe(true);
    }
  });
});
