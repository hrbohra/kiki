import type { VoicePack, VoiceProvider } from './types';

/** Drop-in replacement for the API's default PromptInjectionVoiceProvider, backed by a tone pack
 *  compiled from Kiki's corpus (see pipeline.ts + VOICE_PIPELINE.md). Wiring it in is a one-line
 *  change in apps/api/src/ai/ai.module.ts:
 *
 *    import { CorpusVoiceProvider } from '@kiki/voice';
 *    const voiceProvider = { provide: VOICE_PROVIDER, useFactory: () => new CorpusVoiceProvider(tonePack) };
 *
 *  Nothing else in the AI layer changes: PromptComposer, the intro service, and the facts-only
 *  content prompt are untouched. The corpus shapes voice only. */
export class CorpusVoiceProvider implements VoiceProvider {
  /** `tonePack` is the compiled system instruction from pipeline.compileTonePack(...). Pass it in
   *  at construction (built offline) so this provider stays synchronous and dependency-free. */
  constructor(private readonly tonePack: string) {}

  pack(): VoicePack {
    return { system: this.tonePack };
  }
}
