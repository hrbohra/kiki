import { Module } from '@nestjs/common';
import { WorldModule } from '../world/world.module';
import { IntroService } from './intro.service';
import { DraftService } from './draft.service';
import { AiRunner } from './ai-runner.service';
import { PromptComposer } from './prompt-composer';
import { VOICE_PROVIDER, PromptInjectionVoiceProvider, type VoiceProvider } from './voice.provider';
import { LLM_PROVIDER, GeminiProvider, type LlmProvider } from './llm.provider';

/** The AI layer in one screen:
 *  - tasks (what is asked, the facts allowed, the guard, the deterministic twin) are pure and live
 *    in @kiki/domain/ai;
 *  - AiRunner executes any task through one ladder (live → cached → baked → compose);
 *  - two ports are swappable without touching a task or the runner:
 *      VOICE_PROVIDER  prompt-injection today; a corpus-derived provider later (voice only)
 *      LLM_PROVIDER    Gemini today; any model later
 *  - services (IntroService, DraftService) only gather facts and pick a task. */
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
  providers: [AiRunner, IntroService, DraftService, PromptComposer, voiceProvider, llmProvider],
  exports: [IntroService, DraftService],
})
export class AiModule {}
