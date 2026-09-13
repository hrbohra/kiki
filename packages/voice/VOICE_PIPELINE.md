# Voice pipeline — turning Kiki's corpus into the LLM's voice

**Blueprint + plug-in port.** This package is the seam a future Kiki team fills in to give the AI
Kiki's own voice, learned from the ~10,000 real Instagram conversations. It ships as a stub
(`src/pipeline.ts` stages throw `TODO`) so the app compiles and runs today on the default
prompt-injection voice, and the corpus pipeline drops in later **without touching the AI layer**.

## The one hard rule

The corpus is used **only to shape voice/style — nowhere else**. It never becomes training data for
matching, ranking, search, or any user-facing content beyond tone. It lives in an isolated,
access-controlled store and is anonymised before anything reads it. The **content** of every intro
still comes exclusively from the trust graph, facts-only, via `@kiki/domain`'s `mutualFriendPrompt`
(the honesty rule is unchanged).

## Two tiers

1. **Now (shipping):** prompt-injection only. `apps/api` uses `PromptInjectionVoiceProvider` — a tone
   pack distilled by hand from public Kiki material (manifesto, updates): warm, honest,
   people-over-property. No corpus, no training.
2. **Later (this package):** a corpus-derived `CorpusVoiceProvider`, compiled offline from the
   pipeline below.

## Pipeline stages (`src/pipeline.ts`)

1. **Ingest** (`ingestCorpus`) — load the conversations into an isolated staging store, separate from
   the app DB. Keep only Kiki's own turns if only Kiki's voice is wanted.
2. **Anonymise** (`anonymise`) — strip/replace PII (names, @handles, emails, phone numbers,
   addresses) with a Presidio-style recogniser **before** any downstream read. Drop turns that
   can't be safely cleaned.
3. **Extract style** (`extractStyle`) — compute a **content-free** `StyleProfile`: sentence length &
   rhythm, formality, warmth, hedging, emoji/exclamation habits, opener/closer patterns, reading
   level. Plus `selectExemplars` — a few short, de-identified examples of the register.
4. **Encode voice** — two options behind the same port:
   - **4a Prompt-side (default):** `compileTonePack(profile, exemplars)` → a system instruction; wrap
     it in `new CorpusVoiceProvider(tonePack)`. Cheapest, no training.
   - **4b Fine-tune / LoRA (optional):** `trainStyleAdapter` on anonymised **style-only** pairs, if
     prompt-injection tone proves insufficient. Style targets only, never facts.
   - **4c Reranker (optional):** `scoreOnVoice` to pick the best of N generations for on-voice-ness.
5. **Guardrails & evals** — content prompt stays facts-only (honesty preserved); a held-out
   style-similarity metric plus a human spot-check gate any change.

## Integration (one line, no refactor)

In `apps/api/src/ai/ai.module.ts`:

```ts
import { CorpusVoiceProvider } from '@kiki/voice';
const voiceProvider = {
  provide: VOICE_PROVIDER,
  useFactory: () => new CorpusVoiceProvider(tonePack), // tonePack compiled offline via the pipeline
};
```

`PromptComposer`, `IntroService`, the LLM provider, and the facts-only content prompt are all
untouched. That is the whole point of the port.
