import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Avatar } from '../../ui/Avatar';
import { Dates, Standing } from '../../ui/glyphs';
import { color, flagOf } from '../../theme/tokens';
import { ITALY_TRIP, offerView } from '../../domain/trips';
import { useCreatedTrip } from '../../demo/createdTrip';
import { WEB_SHADOW } from './webBits';
import { OfferModal } from './OfferModal';

import type { OfferView } from '../../domain/trips';
import type { RootNav } from '../../navigation';

/** A posted trip and the offers on it. The traveller's inverse of Requests — built around nights
 *  coverage, since an offer is partial by default. Serves the fixtured trip or a just-created one. */
export function TripOffersWeb({ tripId }: { tripId: 'italy' | 'created' }) {
  const navigation = useNavigation<RootNav>();
  const created = useCreatedTrip();
  const trip = tripId === 'created' && created ? created : ITALY_TRIP;
  const offers = trip.offers.map((o) => offerView(o, trip));
  const [openOffer, setOpenOffer] = useState<string | null>(null);
  const active = offers.find((o) => o.id === openOffer) ?? null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.col}>
          <View style={[styles.card, styles.headerCard]}>
            <Pressable style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back"><Text style={styles.backGlyph}>←</Text></Pressable>
            <View style={styles.iconTile}><Dates size={27} color={color.ink} /></View>
            <Text style={styles.tripName}>{trip.name}</Text>
            <Text style={styles.tripMeta}>{trip.dates} · {trip.nights} nights · £{trip.budget} / night</Text>
          </View>

          <View style={styles.offersHead}>
            <Text style={styles.offersTitle}>Offers</Text>
            <Text style={styles.offersSub}>{offers.length} {offers.length === 1 ? 'offer' : 'offers'} · nobody has to cover the whole trip</Text>
          </View>

          {offers.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No offers yet.</Text>
              <Text style={styles.emptyBody}>Everyone within two steps of you can see this trip from today. Some trips get an offer in a day, some never do — we won't send you a fake nudge either way.</Text>
            </View>
          ) : (
            <View style={{ gap: 22 }}>
              {offers.map((o) => <OfferCard key={o.id} o={o} onOpen={() => setOpenOffer(o.id)} />)}
            </View>
          )}

          {offers.length > 0 ? (
            <Text style={styles.footer}>Offers are ordered by when they arrived, never by price. Declining one costs you nothing.</Text>
          ) : null}
        </View>
      </ScrollView>

      {active ? <OfferModal offer={active} onClose={() => setOpenOffer(null)} /> : null}
    </View>
  );
}

function OfferCard({ o, onOpen }: { o: OfferView; onOpen: () => void }) {
  return (
    <View style={[styles.offer, WEB_SHADOW]}>
      {o.isNew ? <View style={styles.newPill}><Text style={styles.newText}>New</Text></View> : null}
      <View style={styles.sentPill}><Text style={styles.sentText}>{o.sent}</Text></View>

      <View style={styles.offerTop}>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={styles.nameRow}><Text style={styles.offerName}>{o.name}</Text><Text style={styles.flag}>{flagOf(o.country)}</Text></View>
          <View style={styles.matchPill}><Text style={styles.matchText}>{o.matchesLabel}</Text></View>
          <View style={{ gap: 2 }}>{o.facts.map((f) => <Text key={f} style={styles.fact}>{f}</Text>)}</View>
        </View>
        <Avatar id={o.id} name={o.name} tint={o.avatarTint} size={76} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.theirOffer}>Their offer:</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.coverNights}>{o.nightsLabel}</Text>
          <Text style={styles.coverTotal}>{o.totalLabel}</Text>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${o.pct}%` }]} /></View>
        <MetaRow label="Requested" value={o.requested} recessed />
        <MetaRow label="Your dates" value={o.yours} />
        <MetaRow label="Works out at" value={o.perNightLabel} />
      </View>

      {o.hasNote ? (
        <View style={styles.noteCard}>
          <View style={styles.noteIcon}><Standing size={18} color={color.ink} /></View>
          <Text style={styles.noteText}>{o.note}</Text>
        </View>
      ) : null}
      {o.showGapBox ? (
        <View style={styles.gapCard}>
          <View style={styles.gapRule} />
          <Text style={styles.gapText}>{o.gapLine} We won't pretend an offer is a whole answer.</Text>
        </View>
      ) : null}

      <Pressable style={styles.seeMore} onPress={onOpen}><Text style={styles.seeMoreText}>Click to see whole request →</Text></Pressable>
    </View>
  );
}

function MetaRow({ label, value, recessed }: { label: string; value: string; recessed?: boolean }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, recessed && styles.metaRecessed]}>{value}</Text>
    </View>
  );
}

const RECESSED = '#8A9099';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.screen },
  scroll: { paddingVertical: 40, paddingHorizontal: 20 },
  col: { maxWidth: 620, width: '100%', alignSelf: 'center', gap: 18 },

  card: { backgroundColor: color.surface, borderRadius: 20, ...WEB_SHADOW },
  headerCard: { padding: 20, alignItems: 'center', gap: 10 },
  back: { position: 'absolute', left: 16, top: 16, width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: color.hairline, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontSize: 15, color: color.inkSoft },
  iconTile: { width: 58, height: 58, borderRadius: 16, backgroundColor: color.hairlineSoft, alignItems: 'center', justifyContent: 'center' },
  iconGlyph: { fontSize: 27 },
  tripName: { fontSize: 24, lineHeight: 31, fontWeight: '700', letterSpacing: -0.5, color: color.ink, textAlign: 'center' },
  tripMeta: { fontSize: 14, lineHeight: 20, color: color.inkSoft, textAlign: 'center' },

  offersHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', paddingHorizontal: 4 },
  offersTitle: { fontSize: 19, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  offersSub: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 19, color: color.inkFaint },

  empty: { backgroundColor: color.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D9D9D4', borderRadius: 20, padding: 32, paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, lineHeight: 23, fontWeight: '700', color: color.inkSoft, textAlign: 'center' },
  emptyBody: { maxWidth: 400, fontSize: 14.5, lineHeight: 21, color: color.inkSoft, textAlign: 'center' },

  offer: { marginTop: 10, backgroundColor: color.surface, borderRadius: 20, padding: 20, gap: 14 },
  newPill: { position: 'absolute', left: 18, top: -10, backgroundColor: color.brand, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  newText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  sentPill: { position: 'absolute', right: 20, top: -10, backgroundColor: color.screen, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  sentText: { fontSize: 11.5, fontWeight: '700', color: color.inkFaint },
  offerTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  offerName: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: color.ink },
  flag: { fontSize: 15 },
  matchPill: { alignSelf: 'flex-start', borderWidth: 1, borderColor: color.brand, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  matchText: { fontSize: 11.5, fontWeight: '800', color: color.textOnMint },
  fact: { fontSize: 14, lineHeight: 21, color: color.inkSoft },

  theirOffer: { fontSize: 13.5, lineHeight: 19, fontWeight: '700', color: color.ink },
  rowBetween: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  coverNights: { fontSize: 16, lineHeight: 23, fontWeight: '700', color: color.ink },
  coverTotal: { fontSize: 16, lineHeight: 23, fontWeight: '700', color: color.ink },
  track: { height: 8, borderRadius: 999, backgroundColor: color.hairlineSoft, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 999, backgroundColor: color.brand },
  metaLabel: { fontSize: 13, lineHeight: 19, color: RECESSED },
  metaValue: { fontSize: 13, lineHeight: 19, color: color.inkSoft },
  metaRecessed: { color: RECESSED },

  noteCard: { backgroundColor: color.brandTint, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  noteIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  noteGlyph: { fontSize: 15 },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600', color: color.textOnMint },
  gapCard: { backgroundColor: color.bg, borderRadius: 14, padding: 12, paddingLeft: 17, overflow: 'hidden' },
  gapRule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  gapText: { fontSize: 13, lineHeight: 19, color: color.ink },

  seeMore: { borderTopWidth: 1, borderTopColor: color.hairlineSoft, paddingTop: 14, alignItems: 'center' },
  seeMoreText: { fontSize: 13.5, fontWeight: '700', color: color.textOnMint },
  footer: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint, paddingHorizontal: 4 },
});
