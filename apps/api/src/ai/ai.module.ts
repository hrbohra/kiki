import { Module } from '@nestjs/common';
import { WorldModule } from '../world/world.module';
import { IntroService } from './intro.service';
import { PromptComposer } from './prompt-composer';
import { VOICE_PROVIDER, PromptInjectionVoiceProvider, type VoiceProvider } from './voice.provider';
import { LLM_PROVIDER, GeminiProvider, type LlmProvider } from './llm.provider';

/** Voice + LLM are provided behind tokens so they are swappable without touching the service:
 *  - VOICE_PROVIDER: prompt-injection today; a corpus-derived provider later (voice only).
 *  - LLM_PROVIDER: Gemini today; any model later. */
const voiceProvider = {
  provide: VOICE_PROVIDER,
  useFactory: (): VoiceProvider => new PromptInjectionVoiceProvider(),
};

const llmProvider = {
  provide: LLM_PROVIDER,
  useFactory: (): LlmProvider => new GeminiProvider(),
};

@Module({
  imports: [WorldModule],
  providers: [IntroService, PromptComposer, voiceProvider, llmProvider],
  exports: [IntroService],
})
export class AiModule {}
