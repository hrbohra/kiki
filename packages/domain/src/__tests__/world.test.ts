import { describe, expect, it } from 'vitest';
import * as world from '../world';

describe('trustStoryFor — warm match (Maia)', () => {
  const story = world.trustStoryFor('emma');

  it('is warm, two degrees, reached two independent ways', () => {
    expect(story.warm).toBe(true);
    expect(story.degrees).toBe(2);
    expect(story.routes.length).toBe(2); // via Nina and via Sophie
  });

  it('shows exactly the consenting mutuals, with the note kept honest', () => {
    const names = story.channels.map((c) => c.voucher.name).sort();
    expect(names).toEqual(['Nina', 'Sophie']);
    const bella = story.channels.find((c) => c.voucher.name === 'Nina')!;
    expect(bella.note).toBeTruthy();
    expect(bella.noteSubject).toBe('Iris'); // the note is about Iris, not Maia
    expect(bella.tie.strength).toBe(3); // stayed with you twice + an event
    const sophie = story.channels.find((c) => c.voucher.name === 'Sophie')!;
    expect(sophie.note).toBeUndefined();
    expect(sophie.tie.strength).toBe(1); // one event, no stays
    expect(story.consentNames.sort()).toEqual(['Nina', 'Sophie']);
  });
});

describe('trustStoryFor — direct connection (Danica)', () => {
  const story = world.trustStoryFor('danica');

  it('is neither warm nor cold: you know them yourself', () => {
    expect(story.direct).toBe(true);
    expect(story.warm).toBe(false);
    expect(story.degrees).toBe(1);
    expect(story.channels).toEqual([]); // no intermediary mutual
    expect(story.directLink?.note).toMatch(/matched/i);
    expect(story.overlaps.length).toBeGreaterThan(0); // you do share something
  });
});

describe('trustStoryFor — cold match (Priya)', () => {
  const story = world.trustStoryFor('priya');

  it('is cold: reachable but no mutuals and nothing in common', () => {
    expect(story.reachable).toBe(true);
    expect(story.warm).toBe(false);
    expect(story.channels).toEqual([]);
    expect(story.overlaps).toEqual([]);
  });

  it('names the far inviter and carries a guest track record from strangers', () => {
    expect(story.inviter?.member.name).toBe('Katelin');
    expect(story.guestTrackRecord.length).toBe(2);
    expect(story.guestTrackRecord.every((g) => g.known === false)).toBe(true);
  });
});
