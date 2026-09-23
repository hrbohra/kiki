// @kiki/domain — the pure, framework-free heart of Kiki: types, the trust graph, similarity,
// geo projection, the mutual-friend intro, and the composed "world" read model. No IO, no UI,
// no React Native. Reused by the API (server-side), both apps (read-only), and the pipeline.

export * from './domain/types';
export * from './domain/fixtures';
export * from './domain/graph';
export * from './domain/ties';
export * from './domain/connection';
export * from './domain/similarity';
export * from './domain/geo';
export * from './domain/mutualFriendIntro';
export * from './domain/profiles';
export * from './domain/requests';
export * from './domain/houseList';
export * from './domain/trips';
export * from './domain/stay';
export * from './domain/guestRecords';
export * from './domain/invite';
export * from './domain/generated';
export * from './seedWorld';

export * from './pipeline/nlp';
export * from './pipeline/textSignals';
export * from './ai';
export * from './pipeline/tiering';

// The data-source-agnostic composition factory + its types, for building a World from any
// source (the API feeds it Postgres rows; the apps use the fixtures-bound default).
export { createWorld } from './world';
export type { World, WorldData, InviteBranchEntry } from './world';

// `world` also exposes the fixtures-bound default selectors as a namespace. It re-exports a few
// names (e.g. Contribution) that also live in ./domain/types, so it stays namespaced to avoid
// duplicate-export collisions.
export * as world from './world';
