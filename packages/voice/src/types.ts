/** The tone pack handed to the model as a system instruction. Structurally identical to the
 *  VoiceProvider contract in apps/api (src/ai/voice.provider.ts) so a provider here drops in with
 *  no import cycle. */
export interface VoicePack {
  system: string;
}

export interface VoiceProvider {
  pack(): VoicePack;
}

/** A quantified, content-free description of Kiki's voice, extracted from the corpus. Voice only —
 *  never facts, matching, or any user-facing content. */
export interface StyleProfile {
  avgSentenceLength: number;
  sentenceLengthStdDev: number;
  formality: number; // 0 casual … 1 formal
  warmth: number; // 0 neutral … 1 warm
  hedging: number; // frequency of hedges ("maybe", "I think")
  emojiRate: number; // emojis per 100 words (expected ~0 for Kiki)
  exclamationRate: number;
  commonOpeners: string[];
  commonClosers: string[];
  readingGradeLevel: number;
}

/** A short, de-identified example that illustrates the register — never verbatim PII. */
export interface Exemplar {
  text: string;
}
