import { describe, expect, it } from 'vitest';
import { analyzeReview, aggregateGuestBook, tokenize } from '../nlp';

describe('tokenize', () => {
  it('lowercases, strips punctuation, and expands n’t into a negator token', () => {
    expect(tokenize("Wasn't very Clean!")).toEqual(['was', 'not', 'very', 'clean']);
  });
});

describe('analyzeReview sentiment', () => {
  it('scores a glowing review positive', () => {
    const a = analyzeReview('Absolutely lovely and welcoming, spotless and so kind.');
    expect(a.sentiment).toBe('positive');
    expect(a.score).toBeGreaterThan(0.15);
  });

  it('scores a bad review negative', () => {
    const a = analyzeReview('Dirty, rude and unresponsive. Avoid.');
    expect(a.sentiment).toBe('negative');
    expect(a.score).toBeLessThan(-0.15);
  });

  it('handles negation: "not clean" is not positive', () => {
    const positive = analyzeReview('The room was clean.');
    const negated = analyzeReview('The room was not clean.');
    expect(negated.score).toBeLessThan(positive.score);
  });
});

describe('trust-signal extraction', () => {
  it('finds canonical trust phrases', () => {
    const a = analyzeReview('I felt so safe, they looked after me and I would host her again.');
    expect(a.trustSignals).toContain('felt safe');
    expect(a.trustSignals).toContain('looked after me');
    expect(a.trustSignals).toContain('would host again');
  });

  it('finds no signals when none are present', () => {
    expect(analyzeReview('The location was central.').trustSignals).toEqual([]);
  });
});

describe('theme tagging', () => {
  it('tags cleanliness and warmth', () => {
    const a = analyzeReview('Spotless flat and such a warm, friendly host.');
    expect(a.themes).toContain('cleanliness');
    expect(a.themes).toContain('warmth');
  });
});

describe('aggregateGuestBook', () => {
  const reviews = [
    'Absolutely lovely and welcoming, spotless and so kind. I felt so safe.',
    'Great communication, central location, would host her again.',
    'Comfortable and clean, a real gem.',
  ];

  it('rolls reviews into dashboard numbers', () => {
    const g = aggregateGuestBook(reviews);
    expect(g.count).toBe(3);
    expect(g.avgScore).toBeGreaterThan(0);
    expect(g.positiveShare).toBeGreaterThan(0.5);
    expect(g.topThemes[0].hits).toBeGreaterThanOrEqual(g.topThemes.at(-1)!.hits); // sorted desc
    expect(g.highlight).not.toBeNull();
  });

  it('is deterministic', () => {
    expect(aggregateGuestBook(reviews)).toEqual(aggregateGuestBook(reviews));
  });

  it('handles an empty guest book without dividing by zero', () => {
    const g = aggregateGuestBook([]);
    expect(g).toEqual({
      count: 0, avgScore: 0, positiveShare: 0, topThemes: [], trustSignalCounts: [], highlight: null,
    });
  });
});
