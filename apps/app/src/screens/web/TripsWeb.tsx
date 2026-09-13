import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { Dates } from '../../ui/glyphs';
import { photoFor } from '../../ui/listingPhotos';
import { WEB_SHADOW } from './webBits';
import { WriteEntryModal } from './WriteEntryModal';
import { ITALY_TRIP } from '../../domain/trips';
import { useCreatedTrip } from '../../demo/createdTrip';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';
import type { RootNav } from '../../navigation';

/** Trips — reframed from receipt to loop-closing: a trip is where trust gets made, so the
 *  page asks for it back. "Out for offers" is the traveller side; writing the owed entry closes
 *  the host-side loop. */
export function TripsWeb() {
  const navigation = useNavigation<RootNav>();
  const created = useCreatedTrip();
  const emma = world.memberById('emma');
  const danica = world.memberById('danica');
  const emmaListing = world.listingForHost('emma');
  const danicaListing = world.listingForHost('danica');
  const [written, setWritten] = useState(false);
  const [modal, setModal] = useState(false);
  const italyCount = `${ITALY_TRIP.offers.length} ${ITALY_TRIP.offers.length === 1 ? 'offer' : 'offers'}`;

  return (
    <View style={{ gap: 20 }}>
      <Text style={styles.h1}>Kiki Trips</Text>

      <View style={styles.cols}>
        <View style={styles.main}>
          <View style={styles.sectionRow}>
            <Text style={styles.h2}>Out for offers</Text>
            <View style={{ flex: 1 }} />
            <Pressable style={styles.planPill} onPress={() => navigation.navigate('PlanTrip')}><Text style={styles.planText}>Plan a trip</Text></Pressable>
          </View>
          {created ? (
            <TripRow name={created.name} meta={`${created.dates} · ${created.nights} nights · £${created.budget} / night`} pill="No offers yet" tone="neutral" onPress={() => navigation.navigate('TripOffers', { tripId: 'created' })} />
          ) : null}
          <TripRow name={ITALY_TRIP.name} meta={`${ITALY_TRIP.dates} · ${ITALY_TRIP.nights} nights · £${ITALY_TRIP.budget} / night`} pill={italyCount} tone="brand" onPress={() => navigation.navigate('TripOffers', { tripId: 'italy' })} />

          <Text style={[styles.h2, { marginTop: 18 }]}>Coming up</Text>
          <View style={[styles.trip, WEB_SHADOW]}>
            <Image source={emmaListing ? photoFor(emmaListing.id) : undefined} style={styles.tripPhoto} resizeMode="cover" />
            <View style={styles.tripBody}>
              <Text style={styles.tripTitle}>{emmaListing?.title} · De Beauvoir</Text>
              <Text style={styles.tripDates}>14 – 21 Sep · 7 nights · £{emmaListing?.pricePerNight}/night</Text>
              <View style={styles.credit}>
                <Avatar id="bella" name="Nina" tint={world.memberById('bella').avatarColor} size={22} />
                <Text style={styles.creditText}>Nina made this match.</Text>
              </View>
            </View>
          </View>

          <Text style={styles.h2}>Been and gone</Text>
          <View style={[styles.trip, WEB_SHADOW]}>
            <Image source={danicaListing ? photoFor(danicaListing.id) : undefined} style={styles.tripPhoto} resizeMode="cover" />
            <View style={styles.tripBody}>
              <Text style={styles.tripTitle}>{danicaListing?.title} · Tooting</Text>
              <Text style={styles.tripDates}>23 – 27 Apr · 4 nights</Text>
              {written ? (
                <View style={styles.owed}>
                  <Text style={styles.owedDone}>Entry written</Text>
                  <Text style={styles.owedText}>{danica.name} can see it now, and so can the next person deciding about her.</Text>
                </View>
              ) : (
                <View style={styles.owed}>
                  <Text style={styles.owedText}>You haven't written {danica.name}'s guest-book entry yet. That gap is why the next person has less to go on.</Text>
                  <Pressable style={styles.owedBtn} onPress={() => setModal(true)}><Text style={styles.owedBtnText}>Write it</Text></Pressable>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.side}>
          <View style={[styles.card, WEB_SHADOW]}>
            <Text style={styles.cardTitle}>What your trips leave behind</Text>
            <Leave value="2" label="stays completed" />
            <Leave value={written ? '2' : '1'} label="guest-book entries written" />
            <Leave value="4" label="people you've vouched for" />
            <Text style={styles.leaveFoot}>What your stays added to the network — not what they cost you.</Text>
          </View>

          {/* the "unchained" moment: rent reframed as freedom, never guilt */}
          <View style={styles.unlockCard}>
            <Text style={styles.unlockTitle}>Two trips for the price of one</Text>
            <Text style={styles.unlockBody}>Every night someone stays covers a night you travel. That's how a wedding back home, or a long weekend in Lisbon, stops being a question of money.</Text>
          </View>

          {written ? null : (
            <View style={styles.openCard}>
              <View style={styles.caveatStrip} />
              <Text style={styles.openHeading}>Still open</Text>
              <Text style={styles.openRow}>You owe {danica.name} a guest-book entry from April.</Text>
            </View>
          )}
        </View>
      </View>

      {modal ? (
        <WriteEntryModal
          guestName={danica.name}
          place="Four nights in Tooting, 23 – 27 April."
          onPost={() => { setWritten(true); setModal(false); }}
          onClose={() => setModal(false)}
        />
      ) : null}
    </View>
  );
}

function Leave({ value, label }: { value: string; label: string }) {
  return <View style={styles.leaveRow}><Text style={styles.leaveVal}>{value}</Text><Text style={styles.leaveLabel}>{label}</Text></View>;
}

function TripRow({ name, meta, pill, tone, onPress }: { name: string; meta: string; pill: string; tone: 'brand' | 'neutral'; onPress: () => void }) {
  return (
    <Pressable style={({ hovered }: any) => [styles.offerRow, WEB_SHADOW, hovered && styles.offerRowHover]} onPress={onPress} accessibilityRole="button">
      <View style={styles.offerIconTile}><Dates size={26} color={color.ink} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.offerName}>{name}</Text>
        <Text style={styles.offerMeta}>{meta}</Text>
      </View>
      <View style={[styles.countPill, tone === 'brand' ? styles.countBrand : styles.countNeutral]}>
        <Text style={[styles.countText, tone === 'brand' ? styles.countTextBrand : styles.countTextNeutral]}>{pill}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, color: color.ink },
  h2: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  planPill: { borderWidth: 1, borderColor: color.brand, borderRadius: radius.pill, paddingHorizontal: 15, paddingVertical: 8 },
  planText: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: color.surface, borderRadius: 20, padding: 18 },
  offerRowHover: { transform: [{ translateY: -2 }] },
  offerIconTile: { width: 50, height: 50, borderRadius: 14, backgroundColor: color.hairlineSoft, alignItems: 'center', justifyContent: 'center' },
  offerIcon: { fontSize: 24 },
  offerName: { fontSize: 17, fontWeight: '700', color: color.ink },
  offerMeta: { fontSize: 13.5, color: color.inkSoft },
  countPill: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  countBrand: { backgroundColor: color.brand },
  countNeutral: { backgroundColor: color.hairlineSoft },
  countText: { fontSize: 11.5, fontWeight: '800' },
  countTextBrand: { color: '#FFFFFF' },
  countTextNeutral: { color: color.inkFaint },
  cols: { flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },
  main: { flexGrow: 1, flexBasis: 420, minWidth: 320, gap: 14 },
  side: { flexGrow: 1, flexBasis: 300, minWidth: 280, gap: 16 },
  trip: { flexDirection: 'row', backgroundColor: color.surface, borderRadius: 20, overflow: 'hidden' },
  tripPhoto: { width: 160, height: '100%', minHeight: 150 },
  tripBody: { flex: 1, padding: 16, gap: 8 },
  tripTitle: { fontSize: 17, fontWeight: '700', color: color.ink },
  tripDates: { fontSize: 14, color: color.inkSoft },
  credit: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  creditText: { fontSize: 13.5, fontWeight: '600', color: color.textOnMint },
  owed: { backgroundColor: color.brandTint, borderRadius: 12, padding: 12, gap: 10, marginTop: 2 },
  owedText: { fontSize: 13.5, lineHeight: 19, color: color.textOnMint },
  owedDone: { fontSize: 14, fontWeight: '800', color: color.textOnMint },
  owedBtn: { backgroundColor: color.brand, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  owedBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },
  card: { backgroundColor: color.surface, borderRadius: 20, padding: 20, gap: 10, ...WEB_SHADOW },
  cardTitle: { fontSize: 16, fontWeight: '700', color: color.ink },
  leaveRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  leaveVal: { fontSize: 22, fontWeight: '800', color: color.ink, width: 30 },
  leaveLabel: { fontSize: 14, color: color.inkSoft },
  leaveFoot: { fontSize: 12.5, color: color.inkFaint, marginTop: 4 },
  unlockCard: { backgroundColor: color.brandTint, borderRadius: 20, padding: 20, gap: 8 },
  unlockTitle: { fontSize: 16, fontWeight: '800', color: color.textOnMint },
  unlockBody: { fontSize: 14, lineHeight: 21, color: color.textOnMintSoft },
  openCard: { backgroundColor: color.surface, borderRadius: 20, padding: 18, paddingLeft: 21, gap: 8, overflow: 'hidden', ...WEB_SHADOW },
  caveatStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  openHeading: { fontSize: 13.5, fontWeight: '700', color: color.caveat },
  openRow: { fontSize: 14.5, lineHeight: 21, color: color.ink },
});
