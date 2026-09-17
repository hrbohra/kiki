import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AiResult, AiTask } from '@kiki/domain';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimiter } from '../common/rate-limit';
import { PromptComposer } from './prompt-composer';
import { LLM_PROVIDER, type LlmProvider } from './llm.provider';

/**
 * The one place a model is ever called. Every AI feature is an AiTask (pure, in @kiki/domain);
 * this runner gives all of them the same behaviour:
 *
 *   live model → guarded by the task → cached
 *   else a cached run of this exact prompt (voice + task version + facts)
 *   else baked content, when the caller has some
 *   else the task's deterministic twin, which is always available and never lies
 *
 * and reports which one spoke. Adding an AI feature is therefore: write a task, call run().
 * No feature gets its own fallback logic, its own cache, its own key handling or its own guard
 * plumbing — and none can forget them.
 */
@Injectable()
export class AiRunner {
  private readonly log = new Logger('AiRunner');
  /** Per-caller budget for LIVE calls only. Over budget, the ladder simply starts at "cached". */
  private readonly live = new RateLimiter(20, 60_000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly composer: PromptComposer,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async run<F>(task: AiTask<F>, facts: F, opts: { baked?: string; caller?: string } = {}): Promise<AiResult> {
    const prompt = this.composer.forTask(task, facts);
    const done = (text: string, source: AiResult['source']): AiResult => ({ text, source, task: task.id, version: task.version });

    if (this.live.check(opts.caller ?? 'anonymous')) {
      const out = await this.llm.generate({ system: prompt.system, user: prompt.user });
      if (out) {
        const verdict = task.guard(out, facts);
        if (verdict.ok) {
          await this.prisma.aiCache.upsert({
            where: { promptHash: prompt.hash },
            update: { text: out, model: this.llm.name },
            create: { promptHash: prompt.hash, text: out, model: this.llm.name },
          });
          return done(out, 'live');
        }
        // A rejected generation is neither shown nor cached. The reason is logged, never the text.
        this.log.warn(`${task.id}@${task.version} rejected: ${verdict.reason}`);
      }
    }

    const cached = await this.prisma.aiCache.findUnique({ where: { promptHash: prompt.hash } });
    if (cached) return done(cached.text, 'cached');
    if (opts.baked) return done(opts.baked, 'baked');
    return done(task.compose(facts), 'composed');
  }
}
