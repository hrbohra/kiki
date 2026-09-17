// Text signals: what a bio or a guest-book entry says about a person, as canonical topics.
//
// Similarity used to match on typed profile facts only (exact trait keys). People say far more
// about themselves in a bio, and their guests say more again in the guest book — so both now feed
// the same matching. This stage is deliberately the same shape as nlp.ts: deterministic, pure,
// lexicon-based, unit-tested. It is also where an embedding model would sit later: text in,
// canonical signals out, so nothing downstream changes when the extractor gets smarter.
//
// A signal is a claim about a TOPIC ("climbing"), never about a person's character. Character
// lives in the guest book's own words and its sentiment roll-up; similarity only ever says
// "you both mention this".

import type { TraitKind } from '../domain/types';

export interface TextSignal {
  key: string; // canonical topic key, e.g. "topic:climbing"
  label: string; // how it reads in a sentence: "climbing", "working from home"
  kind: TraitKind;
}

interface LexiconEntry extends TextSignal { re: RegExp }

// Ordered roughly by how trust-building the shared ground is. Patterns are word-bounded and
// conservative: a false "you both" is worse than a missed one.
const LEXICON: LexiconEntry[] = [
  { key: 'topic:new-zealand', label: 'New Zealand', kind: 'origin', re: /\b(new zealand|kiwi|auckland|mount eden|wellington|christchurch)\b/ },
  { key: 'topic:australia', label: 'Australia', kind: 'origin', re: /\b(australia|aussie|sydney|melbourne|perth|brisbane)\b/ },
  { key: 'topic:paris', label: 'Paris', kind: 'education', re: /\bparis\b/ },
  { key: 'topic:design', label: 'design', kind: 'work', re: /\b(designer|design)\b/ },
  { key: 'topic:fashion', label: 'fashion', kind: 'work', re: /\bfashion\b/ },
  { key: 'topic:music', label: 'music', kind: 'work', re: /\b(musician|music|records?|vinyl|gigs?)\b/ },
  { key: 'topic:wfh', label: 'working from home', kind: 'work', re: /\b(works? from home|working from home|works? hybrid|hybrid work)\b/ }, // a "WFH desk" describes a room, not a person
  { key: 'topic:climbing', label: 'climbing', kind: 'interest', re: /\b(boulder(?:ing|s)?|climb(?:s|ing|er)?)\b/ },
  { key: 'topic:ceramics', label: 'ceramics', kind: 'interest', re: /\b(ceramics?|pottery)\b/ },
  { key: 'topic:running', label: 'running', kind: 'interest', re: /\b(parkrun|run club|running|runner)\b/ },
  { key: 'topic:swimming', label: 'swimming', kind: 'interest', re: /\b(swim(?:s|ming)?|lido|ponds)\b/ },
  { key: 'topic:yoga', label: 'yoga', kind: 'interest', re: /\byoga\b/ },
  { key: 'topic:cycling', label: 'cycling', kind: 'interest', re: /\b(cycl(?:e|es|ing|ist)|bike)\b/ },
  { key: 'topic:cooking', label: 'cooking', kind: 'interest', re: /\b(cook(?:s|ing|ed)?|baking|bakes?)\b/ },
  { key: 'topic:coffee', label: 'good coffee', kind: 'interest', re: /\b(coffee|flat white|caf[eé]s?)\b/ },
  { key: 'topic:plants', label: 'plants', kind: 'interest', re: /\bplants?\b/ },
  { key: 'topic:pets', label: 'animals', kind: 'interest', re: /\b(cats?|dogs?|pets?|pet-friendly)\b/ },
  { key: 'topic:quiet', label: 'a quiet home', kind: 'interest', re: /\b(quiet|calm|peaceful)\b/ },
];

/** Every canonical topic a piece of text touches. Order follows the lexicon, so it is stable. */
export function extractSignals(text: string | undefined | null): TextSignal[] {
  if (!text) return [];
  const lower = ` ${text.toLowerCase()} `;
  return LEXICON.filter((e) => e.re.test(lower)).map(({ key, label, kind }) => ({ key, label, kind }));
}

export type SignalSource = 'profile' | 'bio' | 'guest_book';

/** Where each topic was found for one member. Profile facts beat a bio, a bio beats what guests wrote. */
export function memberSignals(input: { traitLabels: string[]; bio?: string; guestBook?: string[] }): Map<string, { signal: TextSignal; source: SignalSource }> {
  const out = new Map<string, { signal: TextSignal; source: SignalSource }>();
  const add = (signals: TextSignal[], source: SignalSource) => { for (const s of signals) if (!out.has(s.key)) out.set(s.key, { signal: s, source }); };
  for (const l of input.traitLabels) add(extractSignals(l), 'profile');
  add(extractSignals(input.bio), 'bio');
  for (const g of input.guestBook ?? []) add(extractSignals(g), 'guest_book');
  return out;
}
