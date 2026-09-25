import { CorpusVoiceProvider } from './corpus-voice.provider';
import { scoreVoice, type VoiceprintModel } from './voiceprint-scorer';

/** The parts of a Voiceprint run this package reads (`voiceprint extract … -o out/`):
 *  - `out/prompt_pack/standard.txt`  → the tone pack (verified voice rules as a system instruction)
 *  - `out/voice.json` → `scorer`     → the on-voice scorer's weights
 *  Both are produced offline from the anonymised corpus; neither contains a quote that appears in
 *  fewer than k conversations (Voiceprint's memorisation check fails the run otherwise). */
export interface VoiceprintOutput {
  tonePack: string;
  voiceJson: { scorer?: VoiceprintModel | null };
}

export interface CorpusVoice {
  provider: CorpusVoiceProvider;
  /** 0..1: how on-voice a draft is, or null when the run had no reference to contrast with. */
  score(text: string): number | null;
  /** Best-of-N: the most on-voice candidate. Every candidate already passed the facts-only content
   *  prompt, so this only chooses between phrasings, never between claims. */
  pickMostOnVoice(candidates: string[]): string;
}

export function fromVoiceprint({ tonePack, voiceJson }: VoiceprintOutput): CorpusVoice {
  const model = voiceJson.scorer ?? null;
  const score = (text: string) => (model ? scoreVoice(text, model) : null);
  return {
    provider: new CorpusVoiceProvider(tonePack),
    score,
    pickMostOnVoice(candidates) {
      if (!candidates.length) throw new Error('pickMostOnVoice: no candidates');
      if (!model) return candidates[0];
      return candidates.reduce((best, c) => (scoreVoice(c, model) > scoreVoice(best, model) ? c : best));
    },
  };
}
