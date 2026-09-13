import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../Avatar';
import { Loop } from '../Loop';
import { TieMeter } from './TieMeter';
import { color, radius } from '../../theme/tokens';
import type { VouchChannel } from '../../domain/types';

interface Props {
  channel?: VouchChannel; // a member vouch — variant derived: worded if it has a note, else wordless
  hostName?: string; // to word the "not about X" correction honestly
  ops?: { label: string; body: string; source: string }; // Kiki's own record
}

/**
 * One endorsement. The variant is DERIVED, never passed: `worded` when the vouch has a note,
 * `wordless` when it doesn't, `ops` when the source is Kiki. Visual weight can't contradict the
 * data because the data chooses the shape.
 */
export function VouchCard({ channel, hostName, ops }: Props) {
  if (ops) {
    return (
      <View style={[styles.shell, styles.opsShell]}>
        <View style={styles.head}>
          <View style={styles.opsTile}><Loop size={30} color="#FFFFFF" opacity={1} strokeWidth={8} /></View>
          <Text style={styles.label}>{ops.label}</Text>
        </View>
        <Text style={styles.opsBody}>{ops.body}</Text>
        <Text style={styles.opsSource}>{ops.source}</Text>
      </View>
    );
  }
  if (!channel) return null;

  const worded = Boolean(channel.note);
  const v = channel.voucher;
  const misattributed = channel.noteSubject && hostName && channel.noteSubject !== hostName;

  return (
    <View style={styles.shell}>
      <View style={styles.strip} />
      <View style={[styles.head, !worded && styles.headCentred]}>
        <Avatar id={v.id} name={v.name} tint={v.avatarColor} country={v.country} size={worded ? 64 : 48} />
        <View style={styles.badge}><Loop size={16} color="#FFFFFF" opacity={1} strokeWidth={10} /></View>
        <Text style={styles.label}>{worded ? `Vouched for by ${v.name}` : `Also vouched by ${v.name}`}</Text>
      </View>

      {worded ? (
        <>
          <View style={styles.quote}>
            <Text style={styles.quoteText}>“{channel.note}”</Text>
            <Text style={styles.cite}>{v.name}</Text>
          </View>
          {misattributed ? (
            <View style={styles.correction}>
              <View style={styles.caveatStrip} />
              <Text style={styles.correctionText}>
                Heads up: {v.name}'s talking about {channel.noteSubject} here, not about {hostName}.
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.dashed}>
          <Text style={styles.dashedText}>{v.name} vouched for them but never wrote anything about them.</Text>
        </View>
      )}

      <View style={styles.routeRow}>
        <Text style={styles.routeLeft}>Through {v.name}. {channel.tie.reason}</Text>
        <View style={styles.routeRight}>
          <Text style={styles.routeStatus}>{worded ? 'Left you a note' : 'No note'}</Text>
          <TieMeter strength={channel.tie.strength} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { backgroundColor: color.brandTint, borderRadius: radius.lg, padding: 16, paddingLeft: 19, gap: 14, overflow: 'hidden' },
  opsShell: { paddingLeft: 16 },
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.brand },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headCentred: { alignItems: 'center' },
  badge: { position: 'absolute', left: 0, bottom: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  opsTile: { width: 48, height: 48, borderRadius: 14, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 14.5, fontWeight: '700', color: color.textOnMint },
  quote: { backgroundColor: color.surface, borderRadius: 12, padding: 12, paddingHorizontal: 14 },
  quoteText: { fontSize: 13.5, lineHeight: 20, color: color.ink },
  cite: { fontSize: 12, color: color.inkSoft, marginTop: 6 },
  correction: { backgroundColor: color.surface, borderRadius: 12, padding: 11, paddingLeft: 14, overflow: 'hidden' },
  caveatStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  correctionText: { fontSize: 12.5, lineHeight: 18, color: color.ink },
  dashed: { borderWidth: 1, borderStyle: 'dashed', borderColor: color.dashedTint, borderRadius: 12, padding: 9, paddingHorizontal: 12 },
  dashedText: { fontSize: 12.5, color: color.textOnMint },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: color.hairlineTint, paddingTop: 8 },
  routeLeft: { flex: 1, fontSize: 12, color: color.textOnMintSoft },
  routeRight: { alignItems: 'flex-end', gap: 4 },
  routeStatus: { fontSize: 11.5, fontWeight: '700', color: color.textOnMint },
  opsBody: { fontSize: 13, lineHeight: 19, color: color.textOnMint },
  opsSource: { fontSize: 12, color: color.textOnMintSoft },
});
