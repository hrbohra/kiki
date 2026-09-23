import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { SentimentMeter, ThemeBar } from '../ui/Bars';
import { TrustPill } from '../ui/TrustPill';
import { Loop } from '../ui/Loop';
import { haptic } from '../ui/feedback';
import { color, font, radius, space, shadow, sentimentColor } from '../theme/tokens';
import { analyzeReview } from '../pipeline/nlp';
import * as world from '../world';
import type { StackProps } from '../navigation';
import type { Review } from '../domain/types';

/**
 * The guest book — the evidence the Trust page cites, read through the pipeline. Sentiment and
 * themes up top, then the entries grouped by whether YOU know the author, because a good word
 * from someone you can call is worth more than one from a stranger — and the app says so.
 * Built to the person page's standard: the same hero card, eyebrowed cards, one sticky action.
 */
export function GuestBookScreen({ route, navigation }: StackProps<'GuestBook'>) {
  const host = world.memberById(route.params.hostId);
  const { reviews, summary } = world.guestBookOf(host.id);
  const maxTheme = summary.topThemes[0]?.hits ?? 1;
  const totalSignals = summary.trustSignalCounts.reduce((s, c) => s + c.count, 0);
  const known = reviews.filter((r) => degreeOf(r.authorId) <= 2);
  const strangers = reviews.filter((r) => degreeOf(r.authorId) > 2);
  const go = (fn: () => void) => () => { haptic.tap(); fn(); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>
      </View>

      <View style={styles.heroWrap}>
        <View style={[styles.hero, shadow.card]}>
          <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={92} ring />
          <Text style={styles.name}>{host.name}'s guest book</Text>
          <Text style={styles.sub}>
            {summary.count === 0
              ? 'No stays yet'
              : `${summary.count} ${summary.count === 1 ? 'entry' : 'entries'} · ${Math.round(summary.positiveShare * 100)}% positive · ${known.length} from people you know`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {summary.count === 0 ? (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>NOTHING TO READ YET</Text>
            <Text style={styles.lead}>No one has stayed with {host.name} on Kiki. You'd be their first — and the first entry here would be yours.</Text>
          </View>
        ) : (
          <>
            <View style={styles.statRow}>
              <Stat value={`${summary.count}`} label={summary.count === 1 ? 'entry' : 'entries'} />
              <Stat value={`${Math.round(summary.positiveShare * 100)}%`} label="positive" />
              <Stat value={`${totalSignals}`} label="trust signals" />
            </View>

            <View style={styles.card}>
              <Text style={styles.eyebrow}>WHAT GUESTS SAY</Text>
              <SentimentMeter score={summary.avgScore} />
              <Text style={styles.subEyebrow}>WHAT COMES UP MOST</Text>
              {summary.topThemes.map((t) => (
                <ThemeBar key={t.theme} label={t.theme} value={t.hits} max={maxTheme} />
              ))}
            </View>

            {/* Tinted card = the warm centre of gravity: trust signals + the pull quote */}
            <View style={styles.quoteCard}>
              <View style={styles.quoteLoop} pointerEvents="none">
                <Loop size={140} color={color.brand} opacity={0.12} />
              </View>
              <Text style={styles.eyebrowOnMint}>TRUST SIGNALS</Text>
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

            {known.length > 0 ? (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>FROM PEOPLE YOU KNOW</Text>
                <Text style={styles.groupNote}>Someone you can call. That's worth more than a stranger's word, and the app says so.</Text>
                {known.map((r) => <Entry key={r.id} review={r} />)}
              </View>
            ) : null}
            {strangers.length > 0 ? (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>FROM PEOPLE OUTSIDE YOUR CIRCLE</Text>
                <Text style={styles.groupNote}>Nobody you know can vouch for these authors. Read them as you would any review.</Text>
                {strangers.map((r) => <Entry key={r.id} review={r} />)}
              </View>
            ) : null}

            <Text style={styles.footnote}>
              Every number here is computed from the entry text by the on-device NLP pass — sentiment, trust-signal and theme extraction — not entered by hand.
            </Text>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.primaryRow}>
          <View style={styles.primaryLeft}>
            <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={34} />
            <View>
              <Text style={styles.primaryName}>{host.name}</Text>
              <Text style={styles.primaryPrice}>{summary.count > 0 ? `${summary.count} ${summary.count === 1 ? 'entry' : 'entries'} · ${Math.round(summary.positiveShare * 100)}% positive` : 'No stays yet'}</Text>
            </View>
          </View>
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]} onPress={go(() => navigation.navigate('Thread', { memberId: host.id }))} accessibilityRole="button">
            <Text style={styles.primaryBtnText}>Message {host.name}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function degreeOf(memberId: string): number {
  const d = world.degreeToHost(memberId);
  return Number.isFinite(d) ? d : 99;
}

function Entry({ review }: { review: Review }) {
  const a = analyzeReview(review.text);
  const author = world.memberById(review.authorId);
  const sentiment = a.sentiment === 'neutral' ? 'mixed' : a.sentiment;
  const chipColor = sentimentColor[sentiment];
  const self = author.id === world.viewerId;
  const deg = degreeOf(author.id);
  return (
    <View style={[styles.review, shadow.card]}>
      <View style={styles.reviewHead}>
        <Avatar id={author.id} name={author.name} tint={author.avatarColor} country={author.country} size={32} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.author}>{author.name}</Text>
          <Text style={styles.authorDeg}>{self ? 'You wrote this' : deg === 1 ? 'You know them directly' : deg === 2 ? 'Two steps from you' : deg === 3 ? 'Three steps from you' : 'Outside your circle'}</Text>
        </View>
        <View style={[styles.sentChip, { borderColor: chipColor }]}>
          <Text style={[styles.sentChipText, { color: chipColor }]}>{sentiment}</Text>
        </View>
      </View>
      <Text style={styles.reviewText}>{review.text}</Text>
      {!self && deg <= 2 ? <TrustPill label="Someone you can call" tone="tint" /> : null}
    </View>
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
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 2 },
  back: { ...font.h3, color: color.brand },
  heroWrap: { paddingHorizontal: 18, paddingTop: 6 },
  hero: { backgroundColor: color.surface, borderRadius: radius.hero, padding: space.xl, alignItems: 'center', gap: space.sm },
  name: { ...font.h2, marginTop: space.sm, textAlign: 'center' },
  sub: { ...font.caption, textAlign: 'center' },
  body: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, gap: 14 },
  statRow: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, paddingVertical: space.md, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: color.ink },
  statLabel: { ...font.caption },
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.hairline, borderRadius: 18, padding: 14, gap: 11 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: color.inkFaint },
  eyebrowOnMint: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: color.textOnMintSoft },
  subEyebrow: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, color: color.inkFaint, marginTop: 2 },
  lead: { ...font.body, color: color.ink },
  quoteCard: { backgroundColor: color.brandTint, borderRadius: 18, padding: space.lg, gap: space.md, overflow: 'hidden' },
  quoteLoop: { position: 'absolute', right: -10, bottom: -10 },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  whitePill: { backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  whitePillText: { fontSize: 11, fontWeight: '700', color: color.textOnMint },
  quoteText: { fontSize: 16, fontWeight: '600', color: color.ink, fontStyle: 'italic', lineHeight: 24 },
  group: { gap: 10 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: color.inkFaint, paddingHorizontal: 2 },
  groupNote: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint, paddingHorizontal: 2, marginTop: -4 },
  review: { backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, padding: space.card, gap: space.sm },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  author: { fontSize: 15, fontWeight: '700', color: color.ink },
  authorDeg: { fontSize: 12, color: color.inkFaint },
  sentChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  sentChipText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  reviewText: { ...font.body, color: color.ink },
  footnote: { ...font.caption, lineHeight: 18, color: color.inkFaint, marginTop: space.xs },
  footer: { backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.hairline, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22, gap: 8 },
  primaryRow: { flexWrap: 'wrap', rowGap: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryName: { fontSize: 14, fontWeight: '600', color: color.ink },
  primaryPrice: { fontSize: 12.5, color: color.inkFaint },
  primaryBtn: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 13, ...shadow.brand },
  primaryPressed: { transform: [{ scale: 0.97 }], backgroundColor: color.brandDark },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
