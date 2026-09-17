import { Logger } from '@nestjs/common';

/** DI token for the LLM provider. */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmRequest {
  system: string;
  user: string;
}

/** Port: a text generator. Returns null when unavailable (no key, quota, or error) so the caller
 *  can fall back. Swapping Gemini for another model is a one-line DI change. */
export interface LlmProvider {
  readonly name: string;
  generate(req: LlmRequest): Promise<string | null>;
}

/** Gemini via REST (zero-dep, server-side key). Model from GEMINI_MODEL (default gemini-3.6-flash). */
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  private readonly log = new Logger('GeminiProvider');
  private readonly model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  async generate(req: LlmRequest): Promise<string | null> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          // a model that has not answered in 15s is, for a person waiting on a draft, not answering
          signal: AbortSignal.timeout(15_000),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: req.system }] },
            contents: [{ parts: [{ text: req.user }] }],
            // Headroom matters: a reasoning model spends output tokens thinking before it writes, and a
            // tight cap returns half a sentence. Tasks are short; the cap is only a ceiling.
            generationConfig: { temperature: 0.8, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 128 } },
          }),
        },
      );
      if (!res.ok) {
        this.log.warn(`Gemini ${res.status}; falling back to cache/baked.`);
        return null;
      }
      const data = (await res.json()) as {
        candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
      };
      // A generation that hit the token ceiling is cut mid-thought: treat it as no answer, so the
      // caller falls back, rather than handing a truncated sentence to the guard or the cache.
      if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        this.log.warn('Gemini hit the output ceiling; treating as no answer.');
        return null;
      }
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
      return text && text.length > 0 ? text : null;
    } catch (err) {
      this.log.warn(`Gemini call failed: ${String(err)}`);
      return null;
    }
  }
}
