# Voice pipeline: turning Kiki's corpus into the LLM's voice

**Port + loader.** The heavy work runs offline in **[Voiceprint](https://github.com/hrbohra/voiceprint)**,
a separate Python tool built for this job. It runs locally on one GPU, anonymises first, and measures
about 155 features per message. It turns the measurements into rules, verifies each rule on held-out
conversations, and exports a tone pack, a scorer and fine-tuning files. This package loads that
output into the app. Kiki's ~10,000 Instagram conversations are **not included here**. Until they
are run through Voiceprint, the app runs on the default prompt-injection voice, and switching over
does not touch the AI layer.

## The one hard rule

The corpus is used **only to shape voice and style, nowhere else**. It never becomes training data
for matching, ranking, search, or any user-facing content beyond tone. It lives in an isolated,
access-controlled store and is anonymised before anything reads it. The **content** of every intro
still comes only from the trust graph, facts-only, via `@kiki/domain`'s `mutualFriendPrompt`. The
honesty rule is unchanged.

## Two tiers

1. **Now (shipping):** prompt injection only. `apps/api` uses `PromptInjectionVoiceProvider`, a tone
   pack distilled by hand from public Kiki material (manifesto, updates): warm, honest,
   people-over-property. No corpus, no training.
2. **With the corpus:** `fromVoiceprint(...)` builds a `CorpusVoiceProvider` from Voiceprint's
   verified tone pack, plus an in-process scorer for choosing the best of N.

## Pipeline

| Stage | Where it runs | What it does |
|---|---|---|
| 1. Ingest | Voiceprint `ingest.py` | Instagram/Messenger export → conversations with reply context |
| 2. Anonymise | Voiceprint `privacy.py` | Presidio + spaCy transformer NER, consistent placeholders (`<PERSON_1>`), residual-risk quarantine, k-anonymity for anything quoted |
| 3. Measure | Voiceprint `features/`, `profile.py` | ~155 features per message (rhythm, punctuation, emoji placement, register, hedging, formality, sentiment, emotions, dialogue and social acts, accommodation), contrasted with a reference, with conversation-level bootstrap CIs and effect sizes |
| 4a. Tone pack | Voiceprint `rules.py`, `export.py` | statistical rules, plus LLM-induced rules verified blind on held-out conversations → `prompt_pack/standard.txt` |
| 4b. Adapter (optional) | Voiceprint `export.py` | `sft.jsonl` and `dpo.jsonl`, style-only pairs, for a LoRA if prompting is not enough |
| 4c. Scorer | Voiceprint `scorer.py` → this package | logistic model over exact surface features; `voiceprint-scorer.ts` is generated and parity-tested against Python |
| 5. Gate | Voiceprint `eval/` | held-out AUC, rule compliance, generation fidelity with content preservation (NLI), privacy metrics |

Running it:

```bash
voiceprint extract kiki_conversations.jsonl -s Kiki -o voice/     # default local-first tier
```

## Integration (one line, no refactor)

In `apps/api/src/ai/ai.module.ts`:

```ts
import { fromVoiceprint } from '@kiki/voice';
import voiceJson from '../../voice/voice.json';
const voice = fromVoiceprint({ tonePack: readFileSync('voice/prompt_pack/standard.txt', 'utf8'), voiceJson });
const voiceProvider = { provide: VOICE_PROVIDER, useFactory: () => voice.provider };
// optional: generate N drafts, keep voice.pickMostOnVoice(drafts)
```

`PromptComposer`, `IntroService`, the LLM provider and the facts-only content prompt are all
untouched. That is the point of the port.
