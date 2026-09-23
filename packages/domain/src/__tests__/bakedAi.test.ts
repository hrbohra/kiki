import { describe, it, expect } from 'vitest';
import { createWorld, members, vouches, listings, reviews, guestReviews, contributions, VIEWER_ID, WORLD_NOW_DAY } from '../index';
import { buildDraftFacts, DRAFT_TASKS, type DraftKind, type DraftAs } from '../ai/drafts';
import { BAKED_DRAFT_KEYS, bakedDraft } from '../ai/bakedDrafts';
import { INTRO_TASK } from '../ai/introTask';
import { bakedIntro } from '../domain/generated';

// The prepared answers are the backstop when the live model is unavailable. They must pass the
// exact guard the live model's answers pass, against the exact facts, or they could say more than
// the graph can prove.
const world = createWorld({ members, vouches, listings, reviews, guestReviews, contributions, nowDay: WORLD_NOW_DAY, viewerId: VIEWER_ID });

describe('prepared drafts', () => {
  it('cover every cold card the demo can show, for both writers and all three kinds', () => {
    const cold = members.filter((m) => m.id !== VIEWER_ID).filter((m) => { const s = world.trustStoryFor(m.id); return !s.warm && !s.direct; });
    for (const m of cold) for (const as of ['host', 'guest'] as DraftAs[]) for (const kind of ['introduce', 'call', 'shorter'] as DraftKind[]) {
      expect(bakedDraft(m.id, kind, as, 14), `${m.id}:${kind}:${as}`).toBeTruthy();
    }
  });

  it.each(BAKED_DRAFT_KEYS)('%s passes its task guard against its own facts', (key) => {
    const [id, kind, as] = key.split(':') as [string, DraftKind, DraftAs];
    const facts = buildDraftFacts(world.trustStoryFor(id), kind, as, 14);
    const verdict = DRAFT_TASKS[kind].guard(bakedDraft(id, kind, as, 14)!, facts);
    expect(verdict, `${key}: ${verdict.reason}`).toEqual({ ok: true });
  });

  it('never answers for a stay length the demo does not ask about', () => {
    expect(bakedDraft('priya', 'shorter', 'host', 28)).toBeUndefined();
  });
});

describe('prepared intros', () => {
  it('every host with a prepared intro passes the intro guard for the demo viewer', () => {
    const hosts = [...new Set(listings.map((l) => l.hostId))];
    const failures: string[] = [];
    for (const h of hosts) {
      const text = bakedIntro(h);
      if (!text) continue;
      const v = INTRO_TASK.guard(text, world.trustStoryFor(h));
      if (!v.ok) failures.push(`${h}: ${v.reason}`);
    }
    expect(failures).toEqual([]);
  });
});
