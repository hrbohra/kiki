// App world facade. The screens all `import * as world from '../world'` and call world.trustStoryFor(),
// world.allListings(), etc. synchronously. This facade delegates those calls to a World built from a
// live API snapshot (set by WorldProvider on load), so every screen renders real, per-viewer data
// through the exact same @kiki/domain selectors — with zero screen changes.
import { createWorld, VIEWER_ID, type World, type WorldData } from '@kiki/domain';

let _world: World | null = null;

/** Whoever is signed in — a live ES-module binding, so `world.viewerId` reflects the current user. */
export let viewerId: string = VIEWER_ID;

/** Called by WorldProvider once the API snapshot arrives (and on refresh). */
export function setWorldData(data: WorldData): void {
  _world = createWorld(data);
  viewerId = _world.viewerId;
}

export function isReady(): boolean {
  return _world !== null;
}

function w(): World {
  if (!_world) throw new Error('world snapshot not loaded yet');
  return _world;
}

export const memberById: World['memberById'] = (id) => w().memberById(id);
export const allListings: World['allListings'] = () => w().allListings();
export const listingById: World['listingById'] = (id) => w().listingById(id);
export const hostOf: World['hostOf'] = (l) => w().hostOf(l);
export const listingForHost: World['listingForHost'] = (id) => w().listingForHost(id);
export const storyFor: World['storyFor'] = (id) => w().storyFor(id);
export const degreeToHost: World['degreeToHost'] = (id) => w().degreeToHost(id);
export const guestBookOf: World['guestBookOf'] = (id) => w().guestBookOf(id);
export const standingOf: World['standingOf'] = (id) => w().standingOf(id);
export const leaderboard: World['leaderboard'] = () => w().leaderboard();
export const viewerFriendNames: World['viewerFriendNames'] = (exclude) => w().viewerFriendNames(exclude);
export const peopleLikeYou: World['peopleLikeYou'] = () => w().peopleLikeYou();
export const trustStoryFor: World['trustStoryFor'] = (id) => w().trustStoryFor(id);
export const inviteBranch: World['inviteBranch'] = () => w().inviteBranch();
