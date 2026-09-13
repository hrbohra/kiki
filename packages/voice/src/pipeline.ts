// Corpus → voice pipeline (BLUEPRINT / STUB). Every stage is intentionally unimplemented — this is
// the plug-in port a future team fills in. See VOICE_PIPELINE.md for the full design.
//
// HARD RULE: the ~10k-conversation corpus is used ONLY to shape voice/style. It never becomes
// training data for matching, ranking, or any user-facing content beyond tone. It stays in an
// isolated, access-controlled store and is anonymised before anything reads it.

import type { Exemplar, StyleProfile } from './types';

export interface RawConversation {
  /** Only Kiki's own turns are needed for voice; the other party's turns can be dropped. */
  kikiTurns: string[];
}

/** Stage 1 — Ingest into an isolated staging store (never the app DB). */
export async function ingestCorpus(_source: string): Promise<RawConversation[]> {
  throw new Error('TODO(voice): load corpus into an isolated, access-controlled store.');
}

/** Stage 2 — Strip/anonymise PII (names, @handles, emails, phone numbers, addresses) BEFORE any
 *  downstream read. Use a Presidio-style recogniser; drop any turn that can't be safely cleaned. */
export async function anonymise(_conversations: RawConversation[]): Promise<RawConversation[]> {
  throw new Error('TODO(voice): PII strip/anonymise before any style extraction.');
}

/** Stage 3 — Extract a quantified STYLE profile (rhythm, warmth, formality, openers/closers…) —
 *  characterising HOW Kiki writes, never WHAT it says. */
export async function extractStyle(_conversations: RawConversation[]): Promise<StyleProfile> {
  throw new Error('TODO(voice): compute the style profile (voice, not content).');
}

/** Stage 3b — Curate a small set of short, de-identified exemplars representative of the register. */
export async function selectExemplars(_conversations: RawConversation[], _profile: StyleProfile): Promise<Exemplar[]> {
  throw new Error('TODO(voice): pick de-identified few-shot exemplars (no verbatim PII).');
}

/** Stage 4a — Encode the profile + exemplars into a system tone pack (prompt-injection path;
 *  cheapest, no training). This is the default production route. */
export function compileTonePack(_profile: StyleProfile, _exemplars: Exemplar[]): string {
  throw new Error('TODO(voice): compile the profile + exemplars into a system tone pack string.');
}

/** Stage 4b (optional) — If prompt-injection tone is insufficient, fine-tune / LoRA on
 *  anonymised STYLE-only pairs. Style targets only; never facts. Returns a model handle/id. */
export async function trainStyleAdapter(_profile: StyleProfile, _exemplars: Exemplar[]): Promise<string> {
  throw new Error('TODO(voice): optional LoRA/fine-tune on style-only pairs.');
}

/** Stage 4c (optional) — A lightweight classifier that scores a candidate generation for
 *  on-voice-ness, so the intro service can pick the best of N. */
export async function scoreOnVoice(_candidate: string, _profile: StyleProfile): Promise<number> {
  throw new Error('TODO(voice): score a generation against the style profile.');
}
