import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { SentimentMeter, ThemeBar } from '../../ui/Bars';
import { TrustPill } from '../../ui/TrustPill';
import { WEB_SHADOW } from './webBits';
import { analyzeReview } from '../../pipeline/nlp';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';

const HOST = 'emma';

/** Guest book — the evidence the Trust tab cites. Themes + the positive meter (kept), and the
 *  entries grouped by whether you know the author, not by date. */
export function GuestBookWeb() {
  const host = world.memberById(HOST);
  const { reviews, summary } = world.guestBookOf(HOST);
  const maxTheme = summary.topThemes[0]?.hits ?? 1;
  const totalSignals = summary.trustSignalCounts.reduce((s, c) => s + c.count, 0);
  const known = reviews.filter((r) => Number.isFinite(world.degreeToHost(r.authorId)) && world.degreeToHost(r.authorId) <= 2);
  const strangers = reviews.filter((r) => !(Number.isFinite(world.degreeToHost(r.authorId)) && world.degreeToHost(r.authorId) <= 2));

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={styles.h1}>{host.name}'s guest book</Text>
        <Text style={styles.sub}>What guests wrote — grouped by whether you know them.</Text>
      </View>

      <View style={styles.cols}>
        {/* dashboard */}
        <View style={styles.dashCol}>
          <View style={[styles.card, WEB_SHADOW]}>
            <Text style={styles.cardTitle}>What guests say</Text>
            <View style={styles.statRow}>
              <Stat value={`${summary.count}`} label="entries" />
              <Stat value={`${Math.round(summary.positiveShare * 100)}%`} label="positive" />
              <Stat value={`${totalSignals}`} label="trust signals" />
            </View>
            <SentimentMeter score={summary.avgScore} />
            <Text style={styles.subhead}>Themes, with receipts</Text>
            {summary.topThemes.map((t) => <ThemeBar key={t.theme} label={t.theme} value={t.hits} max={maxTheme} />)}
            {summary.trustSignalCounts.length ? (
              <View style={styles.signalRow}>
                {summary.trustSignalCounts.map((s) => <TrustPill key={s.signal} label={`${s.signal} ·${s.count}`} tone="tint" />)}
              </View>
            ) : null}
          </View>
          <View style={styles.limitsCard}>
            <View style={styles.caveatStrip} />
            <Text style={styles.limitsHeading}>What this book can't tell you</Text>
            <Text style={styles.limitsRow}>Every entry describes {host.name} as a host, never as a guest.</Text>
            <Text style={styles.limitsRow}>Nobody here has handed her their keys and gone away, which is the thing you'd be doing.</Text>
          </View>
        </View>

        {/* reviews grouped by author distance */}
        <View style={styles.reviewCol}>
          <Text style={styles.groupLabel}>FROM PEOPLE YOU KNOW</Text>
          {known.map((r) => <ReviewCard key={r.id} r={r} knownAuthor />)}
          <Text style={styles.groupLabel}>FROM PEOPLE YOU DON'T</Text>
          {strangers.length
            ? strangers.map((r) => <ReviewCard key={r.id} r={r} knownAuthor={false} />)
            : (
              <View style={styles.emptyStrangers}>
                <Text style={styles.emptyStrangersText}>No one outside your circle has written about {host.name}. Everything above comes from {summary.count} people you can go and ask yourself.</Text>
              </View>
            )}
        </View>
      </View>
    </View>
  );
}

function ReviewCard({ r, knownAuthor }: { r: { id: string; authorId: string; text: string; day: number }; knownAuthor: boolean }) {
  const author = world.memberById(r.authorId);
  const a = analyzeReview(r.text);
  const deg = world.degreeToHost(r.authorId);
  return (
    <View style={[styles.review, knownAuthor ? styles.reviewKnown : styles.reviewStranger, WEB_SHADOW]}>
      {knownAuthor ? <View style={styles.tealStrip} /> : null}
      <View style={styles.reviewHead}>
        <Avatar id={author.id} name={author.name} tint={author.avatarColor} country={author.country} size={34} />
        <View style={styles.reviewMeta}>
          <Text style={styles.author}>{author.name}</Text>
          <Text style={styles.reviewSub}>{Number.isFinite(deg) && deg <= 2 ? (deg === 1 ? 'One step from you' : 'Two steps from you') : "someone you don't know"}</Text>
        </View>
        <TrustPill label={a.sentiment === 'neutral' ? 'mixed' : a.sentiment} tone={a.sentiment === 'positive' ? 'tint' : 'outline'} />
      </View>
      <Text style={styles.reviewText}>{r.text}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  h1: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, color: color.ink },
  sub: { fontSize: 14, color: color.inkFaint, marginTop: 4 },
  cols: { flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },
  dashCol: { flexGrow: 1, flexBasis: 360, minWidth: 320, gap: 16 },
  reviewCol: { flexGrow: 1, flexBasis: 420, minWidth: 320, gap: 12 },
  card: { backgroundColor: color.surface, borderRadius: 20, padding: 20, gap: 14, ...WEB_SHADOW },
  cardTitle: { fontSize: 18, fontWeight: '700', color: color.ink },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: color.screen, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  statValue: { fontSize: 21, fontWeight: '700', color: color.ink },
  statLabel: { fontSize: 12.5, color: color.inkFaint },
  subhead: { fontSize: 11.5, fontWeight: '700', color: color.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  limitsCard: { backgroundColor: color.surface, borderRadius: 20, padding: 20, paddingLeft: 23, gap: 8, overflow: 'hidden', ...WEB_SHADOW },
  caveatStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  limitsHeading: { fontSize: 13.5, fontWeight: '700', color: color.caveat },
  limitsRow: { fontSize: 14.5, lineHeight: 21, color: color.ink },
  groupLabel: { fontSize: 11.5, fontWeight: '700', color: color.inkFaint, letterSpacing: 0.8, marginTop: 4 },
  review: { borderRadius: 20, padding: 18, paddingLeft: 20, gap: 10, overflow: 'hidden' },
  reviewKnown: { backgroundColor: color.brandTint },
  reviewStranger: { backgroundColor: color.surface },
  tealStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.brand },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewMeta: { flex: 1 },
  author: { fontSize: 15, fontWeight: '700', color: color.ink },
  reviewSub: { fontSize: 12.5, color: color.inkFaint },
  reviewText: { fontSize: 15, lineHeight: 22, color: color.ink },
  emptyStrangers: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#D9D9D4', borderRadius: 20, padding: 18 },
  emptyStrangersText: { fontSize: 14.5, lineHeight: 21, color: color.inkFaint },
});
