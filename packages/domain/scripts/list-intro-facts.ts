// Prints what the intro task may say about each host, from the demo viewer's side, so prepared
// intros can be written against exactly those facts. Run: npx tsx scripts/list-intro-facts.ts
import { createWorld, members, vouches, listings, reviews, guestReviews, contributions, VIEWER_ID, WORLD_NOW_DAY } from '../src/index';
import { INTRO_TASK } from '../src/ai/introTask';

const world = createWorld({ members, vouches, listings, reviews, guestReviews, contributions, nowDay: WORLD_NOW_DAY, viewerId: VIEWER_ID });
for (const hostId of [...new Set(listings.map((l) => l.hostId))]) {
  const story = world.trustStoryFor(hostId);
  console.log(`=== ${hostId}\n${INTRO_TASK.prompt(story)}\n`);
}
