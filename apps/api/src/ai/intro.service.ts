import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { bakedIntro, INTRO_TASK, type AiSource } from '@kiki/domain';
import { WorldService } from '../world/world.service';
import { AiRunner } from './ai-runner.service';

export type IntroSource = AiSource;

export interface IntroResult {
  text: string;
  source: IntroSource;
}

/** The mutual-friend intro, generated server-side from the live trust graph. It is one AiTask run
 *  through the shared runner, so it inherits the ladder every AI feature has: live model → cached
 *  run → baked (generated.json) → deterministic compose. The demo never breaks; each source is
 *  reported honestly. */
@Injectable()
export class IntroService {
  constructor(
    private readonly world: WorldService,
    private readonly runner: AiRunner,
  ) {}

  async forHost(hostId: string): Promise<IntroResult> {
    const world = await this.world.world();
    let story;
    try {
      story = world.trustStoryFor(hostId);
    } catch {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown host.' });
    }
    const { text, source } = await this.runner.run(INTRO_TASK, story, { baked: bakedIntro(hostId), caller: 'intro' });
    return { text, source };
  }
}
