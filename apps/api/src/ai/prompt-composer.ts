import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { AiTask } from '@kiki/domain';
import { VOICE_PROVIDER, type VoiceProvider } from './voice.provider';

export interface ComposedPrompt {
  system: string; // voice (swappable port) + the task's own instructions
  user: string; // facts-only content prompt, built by the task
  hash: string; // cache key over (task id, version, system, user)
}

/** Joins the two seams of every prompt: the VOICE (how Kiki sounds — a port, so a corpus-derived
 *  provider can replace it) and the TASK (what is being asked, and the facts it may use — pure
 *  functions in @kiki/domain). Neither knows about the other. */
@Injectable()
export class PromptComposer {
  constructor(@Inject(VOICE_PROVIDER) private readonly voice: VoiceProvider) {}

  forTask<F>(task: AiTask<F>, facts: F): ComposedPrompt {
    const pack = this.voice.pack();
    const system = `${pack.tone ?? pack.system}\n\n${task.instructions}`;
    const user = task.prompt(facts);
    const hash = createHash('sha256').update(`${task.id}@${task.version}\n${system}\n---\n${user}`).digest('hex');
    return { system, user, hash };
  }
}
