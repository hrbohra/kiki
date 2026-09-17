import { View, Text, Pressable, StyleSheet } from 'react-native';
import { haptic } from '../../ui/feedback';

import { Avatar } from '../../ui/Avatar';
import { color } from '../../theme/tokens';
import { WebModal } from './WebModal';

import type { OfferView } from '../../domain/trips';

/** The whole request behind an offer. States the coverage gap plainly either way, then the
 *  About facts and the honest disclosure that accepting only opens a thread. */
export function OfferModal({ offer, onClose }: { offer: OfferView; onClose: () => void }) {
  return (
    <WebModal width={560} onClose={onClose}>
      <View style={styles.head}>
        <Avatar id={offer.id} name={offer.name} tint={offer.avatarTint} size={46} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{offer.name}’s offer</Text>
          <Text style={styles.sub}>{offer.sent} · {offer.matchesLabel}</Text>
        </View>
      </View>

      <View style={styles.well}>
        <View style={styles.rowBetween}>
          <Text style={styles.wellNights}>{offer.weeksLabel}</Text>
          <Text style={styles.wellTotal}>{offer.totalLabel}</Text>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${offer.pct}%` }]} /></View>
        <MetaRow label="They requested" value={offer.requested} strong />
        <MetaRow label="Your dates" value={offer.yours} strong />
        <MetaRow label="Works out at" value={offer.perWeekLabel} strong />
      </View>

      {offer.hasGap ? (
        <View style={styles.gapCard}>
          <View style={styles.gapRule} />
          <Text style={styles.gapHeading}>What this doesn’t cover</Text>
          <Text style={styles.gapBody}>{offer.gapLine} You would need somewhere else for those, or a second offer alongside this one.</Text>
        </View>
      ) : null}

      <View style={styles.about}>
        <Text style={styles.aboutTitle}>About {offer.name}</Text>
        {offer.facts.map((f) => <Text key={f} style={styles.fact}>{f}</Text>)}
      </View>

      <Text style={styles.disclosure}>Accepting opens a thread. It does not confirm anything until you both agree the dates.</Text>
      <View style={styles.actions}>
        <Pressable style={styles.accept} onPress={() => { haptic.success(); onClose(); }}><Text style={styles.acceptText}>Accept and message</Text></Pressable>
        <Pressable style={styles.decline} onPress={onClose}><Text style={styles.declineText}>Decline</Text></Pressable>
      </View>
    </WebModal>
  );
}

function MetaRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, strong && styles.metaValueStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 28 },
  title: { fontSize: 19, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  sub: { fontSize: 13.5, lineHeight: 19, color: color.inkFaint },

  well: { marginTop: 16, backgroundColor: color.screen, borderRadius: 14, padding: 16, gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  wellNights: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: color.ink },
  wellTotal: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: color.ink },
  track: { height: 8, borderRadius: 999, backgroundColor: '#E4EAE8', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 999, backgroundColor: color.brand },
  metaLabel: { fontSize: 13, lineHeight: 19, color: color.inkFaint },
  metaValue: { fontSize: 13, lineHeight: 19, color: color.ink },
  metaValueStrong: { color: color.ink },

  gapCard: { marginTop: 16, backgroundColor: color.surface, borderWidth: 1, borderColor: color.hairline, borderRadius: 14, padding: 14, paddingLeft: 19, gap: 6, overflow: 'hidden' },
  gapRule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  gapHeading: { fontSize: 13.5, lineHeight: 19, fontWeight: '700', color: color.caveat },
  gapBody: { fontSize: 14.5, lineHeight: 21, color: color.ink },

  about: { marginTop: 16, gap: 6 },
  aboutTitle: { fontSize: 13.5, lineHeight: 19, fontWeight: '700', color: color.ink },
  fact: { fontSize: 14.5, lineHeight: 21, color: color.inkSoft },

  disclosure: { marginTop: 16, fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
  actions: { marginTop: 12, flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  accept: { flexGrow: 1, minWidth: 140, backgroundColor: color.brand, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  acceptText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  decline: { borderWidth: 1, borderColor: color.hairline, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center' },
  declineText: { fontSize: 15, fontWeight: '700', color: color.inkSoft },
});
