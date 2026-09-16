import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { WEB_SHADOW } from './webBits';
import { guestRecordFor } from '../../domain/guestRecords';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';

/**
 * The guest side of the Trust tab — the question a host is actually exposed to: how does this
 * person treat someone else's flat? The eyebrow rules `brand` when there is evidence and
 * `caution` when there is not, and a zero is presented as a real answer rather than a gap.
 */
export function GuestColumn({ hostId, onBackToHost }: { hostId: string; onBackToHost: () => void }) {
  const host = world.memberById(hostId);
  const g = guestRecordFor(hostId);
  const rule = g.has ? color.brand : color.caveat;

  return (
    <View style={{ gap: 24 }}>
      {/* AS A GUEST headline card */}
      <View style={[styles.card, styles.headCard]}>
        <View style={[styles.rule, { backgroundColor: rule }]} />
        <Text style={[styles.eyebrow, { color: rule }]}>AS A GUEST</Text>
        <Text style={styles.title}>{g.title}</Text>
        <Text style={styles.body}>{g.body}</Text>
      </View>

      {/* counts strip — same shape as the host side */}
      <View style={[styles.card, styles.counts]}>
        {g.counts.map((c) => (
          <View key={c.label} style={styles.countCell}>
            <Text style={styles.countLabel}>{c.label}</Text>
            <Text style={styles.countValue}>{c.value}</Text>
            <Text style={styles.countNote}>{c.note}</Text>
          </View>
        ))}
        <Text style={styles.countsFoot}>A zero here is a real answer, not a gap we are hiding.</Text>
      </View>

      {/* entries (dashed, uncheckable) or the honest empty card */}
      {g.entries.length ? (
        <View style={{ gap: 14 }}>
          <Text style={styles.h2}>What their hosts wrote</Text>
          {g.entries.map((e) => (
            <View key={e.authorId} style={styles.entry}>
              <View style={styles.entryHead}>
                <Avatar id={e.authorId} name={e.name} tint={color.peripheralNode} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryName}>{e.name}</Text>
                  <Text style={styles.entryDegree}>{e.known ? 'Someone you know' : "Someone you don't know"}</Text>
                </View>
              </View>
              <Text style={styles.entryText}>{e.text}</Text>
            </View>
          ))}
          <Text style={styles.dashNote}>Dashed because you cannot check these. Nobody in your circle knows either author.</Text>
        </View>
      ) : (
        <View style={styles.emptyEntries}>
          <Text style={styles.emptyTitle}>No one has written about {host.name} as a guest.</Text>
          <Text style={styles.emptyBody}>There is nothing here to read. We would rather show you an empty page than pad it with the hosting reviews you have already seen.</Text>
        </View>
      )}

      {/* fallback / caveat + back to host */}
      <View style={[styles.card, styles.fallback]}>
        <Text style={styles.fallbackTitle}>{g.fallbackTitle}</Text>
        <Text style={styles.fallbackBody}>{g.fallbackBody}</Text>
        <Pressable style={styles.backLink} onPress={onBackToHost}><Text style={styles.backLinkText}>Back to the host side ›</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: 20, ...WEB_SHADOW },
  headCard: { overflow: 'hidden', padding: 24, paddingLeft: 27, gap: 10 },
  rule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  title: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: color.ink },
  body: { fontSize: 15, lineHeight: 22, color: color.inkSoft },

  counts: { padding: 22, paddingHorizontal: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  countCell: { flexGrow: 1, flexBasis: 150, minWidth: 0, gap: 4 },
  countLabel: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
  countValue: { fontSize: 19, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  countNote: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
  countsFoot: { flexBasis: '100%', borderTopWidth: 1, borderTopColor: color.hairlineSoft, paddingTop: 12, fontSize: 12.5, lineHeight: 18, color: color.inkFaint },

  h2: { fontSize: 19, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  entry: { backgroundColor: color.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D9D9D4', borderRadius: 20, padding: 18, paddingHorizontal: 20, gap: 10 },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryName: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: color.ink },
  entryDegree: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
  entryText: { fontSize: 15, lineHeight: 22, color: color.ink },
  dashNote: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },

  emptyEntries: { backgroundColor: color.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D9D9D4', borderRadius: 20, padding: 24, gap: 8 },
  emptyTitle: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: color.inkSoft },
  emptyBody: { fontSize: 14.5, lineHeight: 21, color: color.inkSoft },

  fallback: { padding: 24, gap: 8, alignItems: 'flex-start' },
  fallbackTitle: { fontSize: 16, lineHeight: 23, fontWeight: '700', color: color.ink },
  fallbackBody: { fontSize: 14.5, lineHeight: 21, color: color.inkSoft },
  backLink: { marginTop: 6, borderWidth: 1, borderColor: color.brand, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  backLinkText: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
});
