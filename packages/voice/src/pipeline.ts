// Corpus → voice pipeline. Stages 1–4 run OFFLINE in Voiceprint (github.com/hrbohra/voiceprint,
// Python, local GPU): ingest, anonymise, measure, induce and verify rules, compile the tone pack,
// export SFT/DPO files and the scorer. This package consumes the result (see voiceprint.ts):
//
//   voiceprint extract kiki_conversations.jsonl -s Kiki -o voice/     # private corpus, local-first tier
//   → voice/prompt_pack/standard.txt   (tone pack)   → fromVoiceprint({ tonePack, voiceJson })
//   → voice/voice.json                 (scorer)
//
// HARD RULE: the ~10k-conversation corpus is used ONLY to shape voice/style. It never becomes
// training data for matching, ranking, or any user-facing content beyond tone. It stays in an
// isolated, access-controlled store and is anonymised before anything reads it.

import { scoreVoice, type VoiceprintModel } from './voiceprint-scorer';

const offline = (stage: string) =>
  new Error(`${stage} runs offline in Voiceprint, not in the app: \`voiceprint extract <corpus> -s Kiki -o voice/\`. ` +
    'Load its output with fromVoiceprint().');

export interface RawConversation {
  /** Only Kiki's own turns are needed for voice; the other party's turns stay as context. */
  kikiTurns: string[];
}

/** Stages 1–3 (ingest, anonymise, measure) — Voiceprint: ingest.py, privacy.py, features/, profile.py. */
export async function ingestCorpus(_source: string): Promise<RawConversation[]> {
  throw offline('Ingest');
}

export async function anonymise(_conversations: RawConversation[]): Promise<RawConversation[]> {
  throw offline('Anonymisation (Presidio + spaCy NER, k-anonymity)');
}

/** Stage 4a — the tone pack is Voiceprint's prompt_pack/standard.txt: verified rules only. */
export function compileTonePack(): string {
  throw offline('Tone-pack compilation');
}

/** Stage 4b (optional) — Voiceprint exports sft.jsonl and dpo.jsonl for a style-only adapter. */
export async function trainStyleAdapter(): Promise<string> {
  throw offline('Adapter training data export');
}

/** Stage 4c — score a candidate for on-voice-ness (0..1) with the scorer from voice.json. Runs
 *  in-process with no model download: a logistic model over exact surface features,
 *  parity-tested against the Python implementation. */
export function scoreOnVoice(candidate: string, model: VoiceprintModel): number {
  return scoreVoice(candidate, model);
}
