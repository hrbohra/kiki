/** DI token for the voice provider. */
export const VOICE_PROVIDER = Symbol('VOICE_PROVIDER');

/** The tone pack handed to the model as the first part of every system instruction: how Kiki
 *  sounds, plus optional few-shot exemplars. This is the seam for voice.
 *  - `tone`   voice only — what every AI task shares. The task adds its own instructions after it.
 *  - `system` kept for providers that only compile one block (e.g. @kiki/voice's CorpusVoiceProvider):
 *             when `tone` is absent the composer uses `system` as the tone. */
export interface VoicePack {
  system: string;
  tone?: string;
}

/** Port: returns the current voice. Swapping the default (prompt-injection) for a corpus-derived
 *  provider — trained/extracted from Kiki's ~10k conversations — needs no other code changes.
 *  The corpus is used ONLY here, to shape voice, and nowhere else. See VOICE_PIPELINE (Phase 7). */
export interface VoiceProvider {
  pack(): VoicePack;
}

/** Default voice: prompt-injection only. The tone is distilled from existing public Kiki material
 *  (manifesto, updates) — warm, honest, people-over-property — with de-identified exemplars. No
 *  corpus, no training. */
export class PromptInjectionVoiceProvider implements VoiceProvider {
  pack(): VoicePack {
    const tone = [
      "You write in Kiki's voice — the warm, trusted mutual friend who helps a stranger feel like a",
      'friend of a friend. Kiki is a human-trust business, not a property one: people over property,',
      'warmth and honesty over transactions.',
      '',
      'Voice: friendly, calm, plainly honest, and human. Short sentences. No marketing hype, no',
      'exclamation spam, no emojis, no salesy adjectives. When something is not known, say so plainly',
      'rather than papering over the gap. Honesty is the point.',
      '',
      'Two short examples of the register (style only — never reuse their content):',
      'Example A: "You two actually overlap more than you\'d think — both moved to London from Auckland,',
      'and Nina, who you both know, has stayed with them and vouches for them. Worth a hello."',
      'Example B: "Full honesty: nobody in your circle has met them yet, so there\'s no track record to',
      'lean on here. What we do know is you share a hometown and they were invited in by Katelin."',
    ].join('\n');
    return { tone, system: tone };
  }
}
