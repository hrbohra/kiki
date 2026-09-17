// What would imported social ties (Instagram mutuals, contacts) do to reach? Add k extra ties per
// member to the seeded club, biased local the way real friendships are, and measure again.
//
//   pnpm --filter @kiki/api measure:ties
//
// The finding this backs (design record, chapter 02): the vouch graph alone cannot introduce most
// people; a "connect your contacts" step is worth more than any ranking algorithm.
import { generateWorld, worldStats, type SeedVouch } from '@kiki/domain';

function rng(seed: number) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const rows: Record<string, string | number>[] = [];
for (const k of [0, 4, 10, 20]) {
  const world = generateWorld({ members: 5000, seed: 20260917 });
  const R = rng(99 + k);
  const extra: SeedVouch[] = [];
  for (const m of world.members) {
    for (let i = 0; i < k / 2; i++) { // each tie touches two people, so k/2 per member ≈ k each
      let o = m;
      for (let t = 0; t < 6; t++) { o = world.members[Math.floor(R() * world.members.length)]; if (o.id !== m.id && (o.areaIndex === m.areaIndex || o.country === m.country || R() < 0.15)) break; }
      if (o.id !== m.id) extra.push({ from: m.id, to: o.id, kind: 'friend', day: 0 });
    }
  }
  world.vouches.push(...extra);
  const s = worldStats(world, 100);
  rows.push({ 'imported ties / member': k, 'median degree': s.degree.median, 'at 2 steps %': s.reachPctBySteps.d2, 'at 3 steps %': s.reachPctBySteps.d3, 'hosts ≤2 steps': Math.round((s.hostsWithin2StepsPct / 100) * world.listings.length) });
}
console.table(rows);
