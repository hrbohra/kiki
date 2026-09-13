import { composeMutualFriendIntro, mutualFriendPrompt } from '../domain/mutualFriendIntro';
import { bakedIntro } from '../domain/generated';

import type { TrustStory } from '../domain/types';

// The seam where the real model slots in. Set EXPO_PUBLIC_INTRO_LLM_URL to a proxy endpoint that
// takes { prompt } and returns { text } (a serverless function calling a tone-trained model on
// Kiki's 10,000 Instagram conversations). With no URL configured — or offline, or on error — we
// fall back to the deterministic composer, so the demo always works, including in Appetize.
//
// This keeps the domain pure (no I/O there) and makes "generated intro" one env var away, which
// is exactly the honest story: deterministic today, the real mutual-friend AI behind the same
// data shape tomorrow.

const ENDPOINT = process.env.EXPO_PUBLIC_INTRO_LLM_URL;

export interface GeneratedIntro {
  text: string;
  /** true only when a live model produced it; false = deterministic fallback. */
  live: boolean;
}

export async function generateIntroText(story: TrustStory): Promise<GeneratedIntro> {
  // Prefer the baked, Gemini-written intro (pipeline/enrich.ts); fall back to the deterministic
  // composer if the pipeline hasn't been run. The live proxy, if configured, still wins below.
  const fallback = bakedIntro(story.host.id) ?? composeMutualFriendIntro(story).paragraph;
  if (!ENDPOINT) return { text: fallback, live: false };
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: mutualFriendPrompt(story) }),
    });
    if (!res.ok) return { text: fallback, live: false };
    const data: unknown = await res.json();
    const text = typeof data === 'object' && data
      ? String((data as Record<string, unknown>).text ?? (data as Record<string, unknown>).completion ?? '').trim()
      : '';
    return text ? { text, live: true } : { text: fallback, live: false };
  } catch {
    return { text: fallback, live: false };
  }
}
