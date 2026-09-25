import { describe, expect, it } from 'vitest';
import { fromVoiceprint, voiceFeatures, type VoiceprintModel } from '../index';

// A two-feature model: rewards exclamation marks and ending on an emoji.
const model: VoiceprintModel = {
  type: 'logistic-surface-v1',
  features: ['exclamations_per_sentence', 'emoji_end'],
  log1p: [],
  mean: [0, 0],
  scale: [1, 1],
  coef: [1.5, 2],
  intercept: -1,
};

describe('voiceprint scorer', () => {
  it('measures surface features', () => {
    const f = voiceFeatures('Sam! the room is free 🙂');
    expect(f.emoji_end).toBe(1);
    expect(f.all_lowercase).toBe(1);
    expect(f.ends_with_question).toBe(0);
  });

  it('prefers the on-voice candidate and falls back without a model', () => {
    const voice = fromVoiceprint({ tonePack: 'Write warmly.', voiceJson: { scorer: model } });
    expect(voice.provider.pack().system).toBe('Write warmly.');
    const best = voice.pickMostOnVoice(['The room is available.', 'Yes! It is free 🙂']);
    expect(best).toBe('Yes! It is free 🙂');
    expect(voice.score('plain.')!).toBeLessThan(voice.score('Great! 🙂')!);
    const bare = fromVoiceprint({ tonePack: 'x', voiceJson: {} });
    expect(bare.score('anything')).toBeNull();
    expect(bare.pickMostOnVoice(['a', 'b'])).toBe('a');
  });
});
