// The mutual-friend introduction, expressed through the same contract as every other AI feature.
// Nothing about the intro changed — its prompt, its honesty rules and its deterministic twin live
// in domain/mutualFriendIntro.ts — this only gives it the standard shape the runner executes.

import { baseGuard, namesGuard, type AiTask } from './task';
import { composeMutualFriendIntro, mutualFriendPrompt } from '../domain/mutualFriendIntro';
import type { TrustStory } from '../domain/types';

export const INTRO_TASK: AiTask<TrustStory> = {
  id: 'intro',
  version: 3,
  instructions: [
    'Write the short introduction a warm mutual friend would send so a stranger feels like a friend of a friend.',
    'Output ONLY the introduction: 2 to 4 sentences, written to the reader, the other person in the third person.',
    'Use ONLY the facts provided. Name shared ground as common ground, never as proof of safety.',
    'If something is not known (no mutuals, no track record), say so plainly.',
    'Do not open by addressing anyone by name, and say nothing about what Kiki itself has or has not done, met or checked: only what the facts state.',
  ].join('\n'),
  prompt: (story) => mutualFriendPrompt(story),
  guard: (text, story) => {
    const base = baseGuard(text, { min: 40, max: 1500 });
    if (!base.ok) return base;
    // The intro is about the host. A vouch note can be about someone else entirely ("She put Iris
    // up for a week"), and a model will happily introduce the wrong person: if the host is never
    // named, or the note's subject is addressed as the person being introduced, reject it.
    const host = story.host.name.split(' ')[0];
    if (!text.includes(host)) return { ok: false, reason: 'never names the host' };
    if (new RegExp(`^${host}\\s*[,:]`).test(text.trim())) return { ok: false, reason: 'addressed to the host instead of the reader' };
    if (/\bwe (haven't|have not|havent) met\b/i.test(text)) return { ok: false, reason: 'claims something about Kiki the facts do not state' };
    for (const c of story.channels) {
      const other = c.noteSubject?.split(' ')[0];
      if (other && other !== host && new RegExp(`\\bYou and ${other}\\b`).test(text)) return { ok: false, reason: 'introduces the subject of a note instead of the host' };
    }
    return namesGuard(text, JSON.stringify({ host: story.host.name, overlaps: story.overlaps, channels: story.channels.map((c) => [c.voucher.name, c.note, c.noteSubject]), inviter: story.inviter?.member.name }));
  },
  compose: (story) => composeMutualFriendIntro(story).paragraph,
};
