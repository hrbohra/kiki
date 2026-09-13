import type { Member, Vouch } from './types';

/**
 * An undirected adjacency view of the trust network.
 *
 * Design note: a vouch is stored directionally (who vouched for whom, and why),
 * but *reachability* is mutual — if Amy vouches for Katelin, a viewer who knows Amy
 * can reach Katelin through her. So pathfinding treats edges as undirected while we
 * keep the original note keyed by the unordered pair for display.
 */
export interface TrustGraph {
  members: Map<string, Member>;
  /** id -> sorted list of neighbour ids (sorted for deterministic, testable paths). */
  neighbours: Map<string, string[]>;
  /** unordered-pair key -> vouch note, if any. */
  notes: Map<string, string | undefined>;
}

/** Stable key for an unordered pair of ids, so {a,b} and {b,a} collide. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function buildGraph(members: Member[], vouches: Vouch[]): TrustGraph {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const adj = new Map<string, Set<string>>();
  const notes = new Map<string, string | undefined>();

  for (const m of members) adj.set(m.id, new Set());

  for (const v of vouches) {
    // Ignore vouches that reference unknown members rather than crashing:
    // real data is messy, and a missing node should degrade gracefully.
    if (!adj.has(v.from) || !adj.has(v.to) || v.from === v.to) continue;
    adj.get(v.from)!.add(v.to);
    adj.get(v.to)!.add(v.from);
    const k = pairKey(v.from, v.to);
    if (!notes.has(k) || v.note) notes.set(k, v.note ?? notes.get(k));
  }

  const neighbours = new Map<string, string[]>();
  for (const [id, set] of adj) neighbours.set(id, [...set].sort());

  return { members: memberMap, neighbours, notes };
}

/**
 * Breadth-first shortest path from `fromId` to `toId`.
 *
 * BFS (not DFS/Dijkstra) because every hop has equal weight — "one degree of
 * separation" — so the first time BFS reaches the target it has found a path with
 * the fewest intermediaries, which is exactly the most trustworthy chain to show.
 * Returns the ordered list of member ids, or null if the host is unreachable.
 */
export function shortestPath(
  graph: TrustGraph,
  fromId: string,
  toId: string,
): string[] | null {
  if (!graph.neighbours.has(fromId) || !graph.neighbours.has(toId)) return null;
  if (fromId === toId) return [fromId];

  const queue: string[] = [fromId];
  const visited = new Set<string>([fromId]);
  const parent = new Map<string, string>();

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    for (const next of graph.neighbours.get(current)!) {
      if (visited.has(next)) continue;
      visited.add(next);
      parent.set(next, current);
      if (next === toId) return reconstruct(parent, fromId, toId);
      queue.push(next);
    }
  }
  return null;
}

function reconstruct(
  parent: Map<string, string>,
  fromId: string,
  toId: string,
): string[] {
  const path: string[] = [toId];
  let cur = toId;
  while (cur !== fromId) {
    const p = parent.get(cur);
    if (p === undefined) break; // defensive; should not happen when a path exists
    path.push(p);
    cur = p;
  }
  return path.reverse();
}

/**
 * ALL shortest paths from `fromId` to `toId`, not just one. `shortestPath` returns a single
 * route, which hides the second independent chain — and two independent chains is the
 * strongest signal on the Trust tab. BFS records every predecessor that sits on a shortest
 * path, then enumerates the routes. Deterministic (sorted neighbours) and bounded by `limit`
 * so a pathological graph can't explode; the cap is logged by the caller if it bites.
 */
export function allShortestPaths(
  graph: TrustGraph,
  fromId: string,
  toId: string,
  limit = 16,
): string[][] {
  if (!graph.neighbours.has(fromId) || !graph.neighbours.has(toId)) return [];
  if (fromId === toId) return [[fromId]];

  const dist = new Map<string, number>([[fromId, 0]]);
  const preds = new Map<string, string[]>(); // node -> predecessors on a shortest path
  const queue: string[] = [fromId];

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    const d = dist.get(current)!;
    for (const next of graph.neighbours.get(current)!) {
      const nd = dist.get(next);
      if (nd === undefined) {
        dist.set(next, d + 1);
        preds.set(next, [current]);
        queue.push(next);
      } else if (nd === d + 1) {
        preds.get(next)!.push(current); // another equally-short way in
      }
    }
  }
  if (!dist.has(toId)) return [];

  // Backtrack from `to` through predecessor layers, enumerating every route.
  const out: string[][] = [];
  const walk = (node: string, tail: string[]) => {
    if (out.length >= limit) return;
    if (node === fromId) {
      out.push([fromId, ...tail]);
      return;
    }
    for (const p of preds.get(node) ?? []) {
      walk(p, [node, ...tail]);
      if (out.length >= limit) return;
    }
  };
  walk(toId, []);
  return out;
}
