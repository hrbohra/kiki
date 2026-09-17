// The mutual-friend introduction, expressed through the same contract as every other AI feature.
// Nothing about the intro changed — its prompt, its honesty rules and its deterministic twin live
// in domain/mutualFriendIntro.ts — this only gives it the standard shape the runner executes.

import { baseGuard, type AiTask } from './task';
import { composeMutualFriendIntro, mutualFriendPrompt } from '../domain/mutualFriendIntro';
import type { TrustStory } from '../domain/types';

export const INTRO_TASK: AiTask<TrustStory> = {
  id: 'intro',
  version: 2,
  instructions: [
    'Write the short introduction a warm mutual friend would send so a stranger feels like a friend of a friend.',
    'Output ONLY the introduction: 2 to 4 sentences, written to the reader, the other person in the third person.',
    'Use ONLY the facts provided. Name shared ground as common ground, never as proof of safety.',
    'If something is not known (no mutuals, no track record), say so plainly.',
  ].join('\n'),
  prompt: (story) => mutualFriendPrompt(story),
  guard: (text) => baseGuard(text, { min: 40, max: 1500 }),
  compose: (story) => composeMutualFriendIntro(story).paragraph,
};
