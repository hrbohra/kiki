import { buildGraph, pairKey, shortestPath, type TrustGraph } from './graph';
import { findOverlaps, type MemberTexts } from './similarity';
import type { ConnectionStory, Member, Vouch } from './types';

/**
 * Compose the full trust story a viewer sees for a given host:
 * the shortest vouch chain between them, the note on each hop, and the overlaps.
 *
 * This is the one function the UI calls. Everything above it is pure and unit-tested;
 * the screen just renders the returned `ConnectionStory`.
 */
export function buildConnectionStory(
  graph: TrustGraph,
  viewerId: string,
  hostId: string,
  textsOf?: (memberId: string) => MemberTexts,
): ConnectionStory {
  const viewer = graph.members.get(viewerId);
  const host = graph.members.get(hostId);
  if (!viewer || !host) {
    return { path: [], hopNotes: [], degrees: Infinity, overlaps: [], reachable: false };
  }

  const ids = shortestPath(graph, viewerId, hostId);
  const overlaps = findOverlaps(viewer, host, textsOf ? { viewer: textsOf(viewerId), host: textsOf(hostId) } : undefined);

  if (!ids) {
    // No vouch chain yet: still show overlaps so a brand-new member isn't a dead end.
    return { path: [], hopNotes: [], degrees: Infinity, overlaps, reachable: false };
  }

  const path = ids.map((id) => graph.members.get(id)!);
  const hopNotes = ids.slice(1).map((id, i) => graph.notes.get(pairKey(ids[i], id)));

  return {
    path,
    hopNotes,
    degrees: path.length - 1,
    overlaps,
    reachable: true,
  };
}

/** Convenience for callers that hold raw arrays rather than a prebuilt graph. */
export function connectionStoryFrom(
  members: Member[],
  vouches: Vouch[],
  viewerId: string,
  hostId: string,
): ConnectionStory {
  return buildConnectionStory(buildGraph(members, vouches), viewerId, hostId);
}
