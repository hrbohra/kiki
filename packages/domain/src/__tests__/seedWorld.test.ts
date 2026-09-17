import { describe, it, expect } from 'vitest';
import { generateWorld, reachFrom, worldStats } from '../seedWorld';
import { buildGraph, allShortestPaths } from '../domain/graph';
import { createWorld } from '../world';

// The finding the graph spec is built on: at club scale, "two steps from you" is rare and three
// steps is the working unit. If a change to the generator moved these numbers, every screen that
// assumes the 14-person fixtures would be lying again — so the shape is asserted, not just printed.
const world = generateWorld({ members: 5000, seed: 20260917 });
const stats = worldStats(world, 120);

describe('seed world', () => {
  it('is deterministic for a seed', () => {
    const again = generateWorld({ members: 5000, seed: 20260917 });
    expect(again.members[17].name).toBe(world.members[17].name);
    expect(again.vouches.length).toBe(world.vouches.length);
    expect(again.listings.length).toBe(world.listings.length);
  });

  it('has the shape of a referral-grown club', () => {
    expect(world.members.length).toBe(5000);
    expect(world.members[0].name.startsWith('Toby')).toBe(true);
    // ~16% host, ~70% of those a room
    expect(world.listings.length).toBeGreaterThan(650);
    expect(world.listings.length).toBeLessThan(1000);
    // the invite tree is a long tail: most members never invite anyone
    const invited = new Map<string, number>();
    for (const [, inviter] of world.inviterOf) invited.set(inviter, (invited.get(inviter) ?? 0) + 1);
    const never = world.members.length - invited.size;
    expect(never / world.members.length).toBeGreaterThan(0.5);
    // prices are per night, the unit Kiki's app uses, and land where a London room does
    for (const l of world.listings) { expect(l.pricePerNight).toBeGreaterThanOrEqual(25); expect(l.pricePerNight).toBeLessThan(110); }
  });

  it('measures reach the way the design record states it', () => {
    expect(stats.degree.median).toBeGreaterThanOrEqual(4);
    expect(stats.degree.median).toBeLessThanOrEqual(6);
    expect(stats.reachPctBySteps.d2).toBeLessThanOrEqual(2); // two steps is rare
    expect(stats.reachPctBySteps.d3).toBeGreaterThan(3); // three steps is the working unit
    expect(stats.reachPctBySteps.d5plus).toBeGreaterThan(50); // most of the club is far away
    expect(stats.hostsWithin2StepsPct).toBeLessThan(4);
  });

  it('feeds the same World the API builds, and the trust story still resolves', () => {
    const w = createWorld({
      members: world.members,
      vouches: world.vouches,
      listings: world.listings,
      reviews: [],
      guestReviews: world.guestReviews,
      contributions: [],
      nowDay: 420,
      viewerId: 'm250',
    });
    const { dist } = reachFrom(world, 'm250', 3);
    const twoStepHost = world.listings.find((l) => dist.get(l.hostId) === 2);
    expect(twoStepHost).toBeDefined();
    const story = w.trustStoryFor(twoStepHost!.hostId);
    expect(story.reachable).toBe(true);
    expect(story.degrees).toBe(2);
    expect(story.routes.length).toBeGreaterThan(0);
  });

  it('keeps every shortest-path enumeration bounded at club scale', () => {
    const graph = buildGraph(world.members, world.vouches);
    const t0 = Date.now();
    for (let i = 1; i <= 40; i++) allShortestPaths(graph, 'm250', `m${i * 100}`);
    expect(Date.now() - t0).toBeLessThan(4000);
  });
});
