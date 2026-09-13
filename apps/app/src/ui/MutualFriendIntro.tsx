import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

import { composeMutualFriendIntro, type IntroPart } from '../domain/mutualFriendIntro';
import { generateIntroText } from '../demo/introLLM';
import { color, radius, shadow } from '../theme/tokens';
import { Compose, Mutual, Vouch, TRAIT_GLYPH } from './glyphs';
import * as world from '../world';

/**
 * The mutual-friend introduction — Kiki's moat, rendered. The message is composed from the trust
 * graph's overlap data (deterministic today; a tone-trained model drops in behind the same shape
 * tomorrow). It reveals like a friend texting you the intro, then shows *why* it can say each
 * thing (provenance) and *which* first-host anxieties it answers (uncertainty reduction, visible).
 */
export function MutualFriendIntro({ hostId }: { hostId: string }) {
  const story = world.trustStoryFor(hostId);
  const intro = composeMutualFriendIntro(story);
  const [writing, setWriting] = useState(true);
  const [paragraph, setParagraph] = useState(intro.paragraph);
  const [live, setLive] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const dots = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    let alive = true;
    setWriting(true);
    fade.setValue(0);
    // Pulse the typing dots while the intro is "written" — deterministic instantly, or a live
    // model if one is configured; either way we hold the typing state for a natural beat.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dots, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dots, { toValue: 0.35, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    const started = Date.now();
    generateIntroText(story).then(({ text, live: isLive }) => {
      const wait = Math.max(0, 950 - (Date.now() - started));
      setTimeout(() => {
        if (!alive) return;
        setParagraph(text);
        setLive(isLive);
        setWriting(false);
        loop.stop();
        Animated.timing(fade, { toValue: 1, duration: 360, useNativeDriver: true }).start();
      }, wait);
    });
    return () => { alive = false; loop.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostId]);

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.head}>
        <Text style={styles.title}>How you know {intro.greeting.split(' ')[0]}</Text>
        <View style={styles.draftPill}>
          <Compose size={16} color={color.textOnMint} accent={color.brand} />
          <Text style={styles.draftText}>{live ? 'AI intro · live' : 'Draft intro'}</Text>
        </View>
      </View>

      {intro.spotlight ? (
        <View style={styles.spotlight}>
          {(() => { const G = TRAIT_GLYPH[intro.spotlight.kind]; return <G size={16} color={color.textOnMint} accent={color.brand} surface={color.brandTint} />; })()}
          <Text style={styles.spotlightText}>{intro.spotlight.text}</Text>
        </View>
      ) : null}

      {writing ? (
        <View style={styles.typingRow}>
          <Animated.View style={[styles.dot, { opacity: dots }]} />
          <Animated.View style={[styles.dot, { opacity: dots }]} />
          <Animated.View style={[styles.dot, { opacity: dots }]} />
          <Text style={styles.typingLabel}>writing your intro…</Text>
        </View>
      ) : (
        <Animated.View style={{ opacity: fade }}>
          <Text style={styles.paragraph}>{paragraph}</Text>
          <View style={styles.chips}>
            {provChips(intro.parts).map((c) => (
              <View key={c.label} style={[styles.chip, c.tone === 'tint' ? styles.chipTint : c.tone === 'dashed' ? styles.chipDashed : styles.chipOutline]}>
                {c.glyph === 'mutual' ? <Mutual size={16} color={color.textOnMint} accent={color.brand} surface={color.brandTint} />
                  : c.glyph === 'vouch' ? <Vouch size={16} color={color.textOnMint} accent={color.brand} surface={color.brandTint} /> : null}
                <Text style={[styles.chipText, c.tone === 'tint' ? styles.chipTextTint : styles.chipTextMuted]}>{c.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      <View style={styles.meter}>
        <Text style={styles.meterTitle}>What this answers</Text>
        {intro.anxieties.map((a) => (
          <View key={a.key} style={styles.meterRow}>
            <View style={[styles.mark, a.covered ? styles.markOn : styles.markOff]}>
              <Text style={[styles.markGlyph, a.covered ? styles.markGlyphOn : styles.markGlyphOff]}>{a.covered ? '✓' : '–'}</Text>
            </View>
            <Text style={[styles.meterLabel, !a.covered && styles.meterLabelOff]}>{a.label}</Text>
            {!a.covered ? <Text style={styles.honest}>not yet</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** One chip per distinct provenance, so a host can see *why* each claim is allowed. */
function provChips(parts: IntroPart[]): { label: string; tone: 'tint' | 'dashed' | 'outline'; glyph?: 'mutual' | 'vouch' }[] {
  const map = new Map<string, { label: string; tone: 'tint' | 'dashed' | 'outline'; glyph?: 'mutual' | 'vouch' }>();
  for (const p of parts) {
    if (p.kind === 'mutual') map.set('m', { label: 'From a mutual', tone: 'tint', glyph: 'mutual' });
    else if (p.kind === 'anecdote') map.set('a', { label: 'A friend vouched', tone: 'tint', glyph: 'vouch' });
    else if (p.provenance === 'inferred') map.set('i', { label: 'We worked it out', tone: 'dashed' });
    else map.set('d', { label: 'Their words', tone: 'outline' });
  }
  return [...map.values()];
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: 20, padding: 20, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 17, fontWeight: '800', color: color.ink },
  draftPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: color.brandTint, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  draftText: { fontSize: 11.5, fontWeight: '800', color: color.textOnMint },
  spotlight: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: color.brandTint, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  spotlightText: { fontSize: 15, fontWeight: '800', color: color.textOnMint },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: color.trust2 },
  typingLabel: { marginLeft: 6, fontSize: 13, color: color.inkFaint, fontStyle: 'italic' },

  paragraph: { fontSize: 15.5, lineHeight: 24, color: color.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  chipTint: { backgroundColor: color.brandTint, borderColor: color.brandTint },
  chipOutline: { backgroundColor: color.surface, borderColor: color.hairline },
  chipDashed: { backgroundColor: color.surface, borderStyle: 'dashed', borderColor: color.dashedTint },
  chipText: { fontSize: 11.5, fontWeight: '700' },
  chipTextTint: { color: color.textOnMint },
  chipTextMuted: { color: color.inkSoft },

  meter: { borderTopWidth: 1, borderTopColor: color.hairlineSoft, paddingTop: 12, gap: 8 },
  meterTitle: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: color.inkFaint },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  markOn: { backgroundColor: color.brand },
  markOff: { borderWidth: 1, borderColor: color.hairline },
  markGlyph: { fontSize: 11, fontWeight: '800' },
  markGlyphOn: { color: '#FFFFFF' },
  markGlyphOff: { color: color.inkFaint },
  meterLabel: { flex: 1, fontSize: 14, color: color.ink },
  meterLabelOff: { color: color.inkFaint },
  honest: { fontSize: 12, color: color.inkFaint, fontStyle: 'italic' },
});
