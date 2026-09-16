import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { SentimentMeter, ThemeBar } from '../ui/Bars';
import { Loop } from '../ui/Loop';
import { color, font, radius, space, shadow, sentimentColor } from '../theme/tokens';
import { analyzeReview } from '../pipeline/nlp';
import * as world from '../world';
import type { StackProps } from '../navigation';

/** Guest book + NLP dashboard: sentiment, themes and trust signals mined from the reviews. */
export function GuestBookScreen({ route, navigation }: StackProps<'GuestBook'>) {
  const host = world.memberById(route.params.hostId);
  const { reviews, summary } = world.guestBookOf(host.id);
  const maxTheme = summary.topThemes[0]?.hits ?? 1;
  const totalSignals = summary.trustSignalCounts.reduce((s, c) => s + c.count, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>{host.name}'s guest book</Text>

        {summary.count === 0 ? (
          <Text style={styles.empty}>No stays yet — you'd be their first.</Text>
        ) : (
          <>
            <View style={styles.statRow}>
              <Stat value={`${summary.count}`} label="reviews" />
              <Stat value={`${Math.round(summary.positiveShare * 100)}%`} label="positive" />
              <Stat value={`${totalSignals}`} label="trust signals" />
            </View>

            <View style={[styles.card, shadow.card]}>
              <Text style={styles.cardTitle}>What guests say</Text>
              <SentimentMeter score={summary.avgScore} />
              <Text style={styles.subhead}>What comes up most</Text>
              {summary.topThemes.map((t) => (
                <ThemeBar key={t.theme} label={t.theme} value={t.hits} max={maxTheme} />
              ))}
            </View>

            {/* Tinted card = the warm centre of gravity: trust signals + the pull quote */}
            <View style={styles.quoteCard}>
              <View style={styles.quoteLoop} pointerEvents="none">
                <Loop size={140} color={color.brand} opacity={0.12} strokeWidth={6} />
              </View>
              {summary.trustSignalCounts.length > 0 ? (
                <View style={styles.signalRow}>
                  {summary.trustSignalCounts.map((s) => (
                    <View key={s.signal} style={styles.whitePill}>
                      <Text style={styles.whitePillText}>{s.signal} ·{s.count}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {summary.highlight ? <Text style={styles.quoteText}>“{summary.highlight}”</Text> : null}
            </View>

            <Text style={styles.subhead}>All reviews</Text>
            {reviews.map((r) => {
              const a = analyzeReview(r.text);
              const author = world.memberById(r.authorId);
              const sentiment = a.sentiment === 'neutral' ? 'mixed' : a.sentiment;
              const chipColor = sentimentColor[sentiment];
              return (
                <View key={r.id} style={[styles.review, shadow.card]}>
                  <View style={styles.reviewHead}>
                    <Avatar id={author.id} name={author.name} tint={author.avatarColor} country={author.country} size={32} />
                    <Text style={styles.author}>{author.name}</Text>
                    <View style={{ flex: 1 }} />
                    <View style={[styles.sentChip, { borderColor: chipColor }]}>
                      <Text style={[styles.sentChipText, { color: chipColor }]}>{sentiment}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{r.text}</Text>
                </View>
              );
            })}

            <Text style={styles.footnote}>
              Every number here is computed from the review text by an on-device NLP pass
              (sentiment, trust-signal and theme extraction) — not entered by hand.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={[styles.stat, shadow.card]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  navbar: { paddingHorizontal: space.screen, paddingVertical: space.md },
  back: { ...font.h3, color: color.brand },
  body: { padding: space.screen, paddingBottom: space.xxl, gap: space.md },
  h1: { ...font.h1 },
  empty: { ...font.body },
  statRow: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, paddingVertical: space.md, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: color.ink },
  statLabel: { ...font.caption },
  card: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.hairline, padding: space.card, gap: space.md },
  cardTitle: { ...font.h3 },
  subhead: { fontSize: 11, fontWeight: '700', color: color.inkSoft, marginTop: space.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  quoteCard: { backgroundColor: color.brandTint, borderRadius: radius.xl, padding: space.lg, gap: space.md, overflow: 'hidden' },
  quoteLoop: { position: 'absolute', right: -10, bottom: -10 },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  whitePill: { backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  whitePillText: { fontSize: 11, fontWeight: '700', color: color.textOnMint },
  quoteText: { fontSize: 16, fontWeight: '600', color: color.ink, fontStyle: 'italic', lineHeight: 24 },
  review: { backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, padding: space.card, gap: space.sm },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  author: { fontSize: 15, fontWeight: '700', color: color.ink },
  sentChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  sentChipText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  reviewText: { ...font.body, color: color.ink },
  footnote: { ...font.caption, lineHeight: 18, color: color.inkFaint, marginTop: space.xs },
});
