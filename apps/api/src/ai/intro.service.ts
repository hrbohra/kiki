import { Inject, Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { bakedIntro, composeMutualFriendIntro } from '@kiki/domain';
import { PrismaService } from '../prisma/prisma.service';
import { WorldService } from '../world/world.service';
import { PromptComposer } from './prompt-composer';
import { LLM_PROVIDER, type LlmProvider } from './llm.provider';

export type IntroSource = 'live' | 'cached' | 'baked' | 'composed';

export interface IntroResult {
  text: string;
  source: IntroSource;
}

/** Generates the mutual-friend intro server-side from the live trust graph, resilient to LLM
 *  outages. Fallback ladder: live model → cached run → baked (generated.json) → deterministic
 *  compose. The demo never breaks; each source is reported honestly. */
@Injectable()
export class IntroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly world: WorldService,
    private readonly composer: PromptComposer,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async forHost(hostId: string): Promise<IntroResult> {
    const world = await this.world.world();
    let story;
    try {
      story = world.trustStoryFor(hostId);
    } catch {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown host.' });
    }

    const prompt = this.composer.compose(story);

    // 1) Live model — accepted only if the output looks like a real intro (guard against the
    //    model leaking reasoning/meta or refusing). Bad output is neither used nor cached.
    const live = await this.llm.generate({ system: prompt.system, user: prompt.user });
    if (live && this.isPlausibleIntro(live)) {
      await this.prisma.aiCache.upsert({
        where: { promptHash: prompt.hash },
        update: { text: live, model: this.llm.name },
        create: { promptHash: prompt.hash, text: live, model: this.llm.name },
      });
      return { text: live, source: 'live' };
    }

    // 2) Cached run (a prior live result for this exact prompt).
    const cached = await this.prisma.aiCache.findUnique({ where: { promptHash: prompt.hash } });
    if (cached) return { text: cached.text, source: 'cached' };

    // 3) Baked content shipped in generated.json.
    const baked = bakedIntro(hostId);
    if (baked) return { text: baked, source: 'baked' };

    // 4) Deterministic compose from the same facts — always available.
    return { text: composeMutualFriendIntro(story).paragraph, source: 'composed' };
  }

  /** Reject model output that leaked reasoning/meta, wrapped itself in markup, refused, or is the
   *  wrong length. Cheap heuristics — the point is to never surface (or cache) a broken generation. */
  private isPlausibleIntro(text: string): boolean {
    const t = text.trim();
    if (t.length < 40 || t.length > 1500) return false;
    const lower = t.toLowerCase();
    const badMarkers = [
      'user prompt',
      'system prompt',
      'step-by-step',
      'step by step',
      'as an ai',
      'language model',
      'i cannot',
      "i can't",
      'instruction',
      'the facts provided',
      '```',
      '**',
    ];
    if (badMarkers.some((m) => lower.includes(m))) return false;
    // Meta openers.
    if (/^(if|okay|sure|here('|’)s|note:|output:|draft:)\b/i.test(t)) return false;
    return true;
  }
}
