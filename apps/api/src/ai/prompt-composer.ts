import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { mutualFriendPrompt, type TrustStory } from '@kiki/domain';
import { VOICE_PROVIDER, type VoiceProvider } from './voice.provider';

export interface ComposedPrompt {
  system: string; // voice (tone pack)
  user: string; // facts-only content prompt from the trust graph
  hash: string; // stable cache key over (system + user)
}

/** Splits the prompt into two seams: the VOICE (system, swappable) and the CONTENT (facts-only,
 *  from @kiki/domain's mutualFriendPrompt — unchanged, honesty-preserving). The corpus-voice
 *  pipeline later swaps only the VoiceProvider; this composer and the content prompt stay put. */
@Injectable()
export class PromptComposer {
  constructor(@Inject(VOICE_PROVIDER) private readonly voice: VoiceProvider) {}

  compose(story: TrustStory): ComposedPrompt {
    const { system } = this.voice.pack();
    const user = mutualFriendPrompt(story);
    const hash = createHash('sha256').update(`${system}\n---\n${user}`).digest('hex');
    return { system, user, hash };
  }
}
