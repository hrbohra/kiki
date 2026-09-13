// Lightweight, dependency-free NLP for the Kiki guest book.
// Adapted and hardened from my dissertation text-analysis pipeline: tokenise ->
// lexicon sentiment with negation handling -> trust-signal extraction -> theme tagging.
// Deterministic and pure, so every guest-book number on the dashboard is unit-tested.
//
// In production this stage is where a transformer model would sit; the interface
// (text in, structured signals out) is identical, so the dashboard never changes.

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface ReviewAnalysis {
  score: number; // normalised sentiment in [-1, 1]
  sentiment: Sentiment;
  trustSignals: string[]; // canonical trust phrases found ("felt safe", "like a friend")
  themes: string[]; // theme buckets the text touches
}

export interface HostGuestBook {
  count: number;
  avgScore: number; // mean sentiment across reviews
  positiveShare: number; // fraction labelled positive
  topThemes: { theme: string; hits: number }[];
  trustSignalCounts: { signal: string; count: number }[];
  highlight: string | null; // the most positive review text, as a pull quote
}

const POSITIVE: Record<string, number> = {
  amazing: 2, incredible: 2, wonderful: 2, perfect: 2, gem: 1.5, lovely: 1.5, great: 1.5,
  good: 1, clean: 1, spotless: 1.5, immaculate: 1.5, welcoming: 1.5, kind: 1.5, friendly: 1.5,
  comfortable: 1, safe: 1.5, helpful: 1, responsive: 1, generous: 1.5, warm: 1, easy: 1,
  recommend: 1.5, thoughtful: 1.5, seamless: 1.5, relaxed: 1,
};

const NEGATIVE: Record<string, number> = {
  dirty: 1.5, messy: 1, rude: 2, unresponsive: 1.5, late: 1, uncomfortable: 1.5, unsafe: 2,
  cold: 1, disappointing: 1.5, avoid: 2, terrible: 2, awful: 2, noisy: 1, cramped: 1,
  broken: 1, ignored: 1.5, sketchy: 1.5,
};

const NEGATORS = new Set(['not', 'no', 'never', 'without', 'hardly', 'barely']);

const TRUST_SIGNALS: { label: string; re: RegExp }[] = [
  { label: 'felt safe', re: /felt (?:so |really |completely |very )?safe/ },
  { label: 'like a friend', re: /like (?:a |an old )?friend/ },
  { label: 'looked after me', re: /look(?:ed)? after/ },
  { label: 'would host again', re: /would (?:host|stay|have)(?: (?:them|her|him))? again/ },
  { label: 'took care of the place', re: /took (?:great )?care/ },
  { label: 'trusted them', re: /trust(?:ed)?(?: her| him| them)?/ },
  { label: 'home away from home', re: /home away from home/ },
  { label: 'no hesitation', re: /no hesitation/ },
];

const THEMES: Record<string, string[]> = {
  cleanliness: ['clean', 'spotless', 'tidy', 'immaculate', 'dirty', 'messy', 'mess'],
  communication: ['responsive', 'replied', 'communication', 'reach', 'clear', 'helpful', 'organised'],
  warmth: ['welcoming', 'kind', 'friendly', 'lovely', 'warm', 'generous', 'thoughtful'],
  safety: ['safe', 'secure', 'comfortable', 'trusted', 'trust', 'ease', 'unsafe'],
  location: ['location', 'central', 'close', 'convenient', 'station', 'area', 'neighbourhood'],
};

/** Split into lowercased word tokens; expand "n't" so negation is a real token. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/n['’]t/g, ' not')
    .split(/[^a-z]+/)
    .filter(Boolean);
}

export function analyzeReview(text: string): ReviewAnalysis {
  const tokens = tokenize(text);
  let raw = 0;
  let hits = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const polarity = POSITIVE[t] ? POSITIVE[t] : NEGATIVE[t] ? -NEGATIVE[t] : 0;
    if (polarity === 0) continue;
    // Negation flips a sentiment word if a negator sits within the preceding 3 tokens.
    const negated = tokens.slice(Math.max(0, i - 3), i).some((w) => NEGATORS.has(w));
    raw += negated ? -polarity : polarity;
    hits += 1;
  }

  // Normalise by matched words (not total length), so a short rave scores as strongly
  // as a long one, then squash into [-1, 1].
  const score = hits === 0 ? 0 : clamp(raw / (hits * 2), -1, 1);
  const lower = ` ${text.toLowerCase()} `;

  const trustSignals = TRUST_SIGNALS.filter((s) => s.re.test(lower)).map((s) => s.label);

  const tokenSet = new Set(tokens);
  const themes = Object.entries(THEMES)
    .filter(([, words]) => words.some((w) => tokenSet.has(w)))
    .map(([theme]) => theme);

  return { score, sentiment: label(score), trustSignals, themes };
}

/** Roll up every review for one host into the numbers the dashboard shows. */
export function aggregateGuestBook(reviews: string[]): HostGuestBook {
  if (reviews.length === 0) {
    return { count: 0, avgScore: 0, positiveShare: 0, topThemes: [], trustSignalCounts: [], highlight: null };
  }

  const analyses = reviews.map((r) => ({ text: r, ...analyzeReview(r) }));
  const avgScore = analyses.reduce((s, a) => s + a.score, 0) / analyses.length;
  const positiveShare = analyses.filter((a) => a.sentiment === 'positive').length / analyses.length;

  const themeHits = new Map<string, number>();
  for (const a of analyses) for (const t of a.themes) themeHits.set(t, (themeHits.get(t) ?? 0) + 1);
  const topThemes = [...themeHits.entries()]
    .map(([theme, hits]) => ({ theme, hits }))
    .sort((a, b) => b.hits - a.hits || a.theme.localeCompare(b.theme));

  const signalCounts = new Map<string, number>();
  for (const a of analyses) for (const s of a.trustSignals) signalCounts.set(s, (signalCounts.get(s) ?? 0) + 1);
  const trustSignalCounts = [...signalCounts.entries()]
    .map(([signal, count]) => ({ signal, count }))
    .sort((a, b) => b.count - a.count || a.signal.localeCompare(b.signal));

  const best = analyses.reduce((a, b) => (b.score > a.score ? b : a));
  const highlight = best.score > 0 ? best.text : null;

  return { count: reviews.length, avgScore, positiveShare, topThemes, trustSignalCounts, highlight };
}

function label(score: number): Sentiment {
  if (score > 0.15) return 'positive';
  if (score < -0.15) return 'negative';
  return 'neutral';
}

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}
