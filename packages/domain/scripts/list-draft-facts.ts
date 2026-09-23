// Prints the facts behind every AI draft the demo can show, so the baked fallbacks can be written
// against exactly what the task is allowed to say. Run: npx tsx scripts/list-draft-facts.ts
import { createWorld, members, vouches, listings, reviews, guestReviews, contributions, VIEWER_ID, WORLD_NOW_DAY } from '../src/index';
import { buildDraftFacts, type DraftKind } from '../src/ai/drafts';

const world = createWorld({ members, vouches, listings, reviews, guestReviews, contributions, nowDay: WORLD_NOW_DAY, viewerId: VIEWER_ID });
const kinds: DraftKind[] = ['introduce', 'call', 'shorter'];
for (const m of members) {
  if (m.id === VIEWER_ID) continue;
  let story;
  try { story = world.trustStoryFor(m.id); } catch { continue; }
  if (story.warm || story.direct) continue;
  for (const as of ['host', 'guest'] as const) {
    for (const kind of kinds) {
      console.log(JSON.stringify({ member: m.id, kind, as, facts: buildDraftFacts(story, kind, as, 14) }));
    }
  }
}
