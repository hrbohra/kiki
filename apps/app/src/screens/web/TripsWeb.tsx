import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { Dates } from '../../ui/glyphs';
import { photoFor } from '../../ui/listingPhotos';
import { WEB_SHADOW } from './webBits';
import { WriteEntryModal } from './WriteEntryModal';
import { ITALY_TRIP, fmtWeeks } from '../../domain/trips';
import { relRange } from '../../domain/relDates';
import { useCreatedTrip } from '../../demo/createdTrip';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';
import type { RootNav } from '../../navigation';

/** Away — reframed from receipt to loop-closing: a stay is where trust gets made, so the
 *  page asks for it back. "Looking for a Kikier" is your place while you are gone; writing the
 *  owed entry closes the loop on the stays you took. */
export function TripsWeb() {
  const navigation = useNavigation<RootNav>();
  const created = useCreatedTrip();
  const emma = world.memberById('emma');
  const danica = world.memberById('danica');
  const emmaListing = world.listingForHost('emma');
  const danicaListing = world.listingForHost('danica');
  const [written, setWritten] = useState(false);
  const [modal, setModal] = useState(false);
  const italyCount = `${ITALY_TRIP.offers.length} ${ITALY_TRIP.offers.length === 1 ? 'person' : 'people'} can cover it`;

  return (
    <View style={{ gap: 20 }}>
      <Text style={styles.h1}>Away</Text>

      <View style={styles.cols}>
        <View style={styles.main}>
          <View style={styles.sectionRow}>
            <Text style={styles.h2}>Looking for a Kikier</Text>
            <View style={{ flex: 1 }} />
            <Pressable style={styles.planPill} onPress={() => navigation.navigate('PlanTrip')}><Text style={styles.planText}>List my place while I’m away</Text></Pressable>
          </View>
          {created ? (
            <TripRow name={created.name} meta={`${created.dates} · ${fmtWeeks(created.weeks)} · £${created.budget} / week`} pill="No offers yet" tone="neutral" onPress={() => navigation.navigate('TripOffers', { tripId: 'created' })} />
          ) : null}
          <TripRow name={ITALY_TRIP.name} meta={`${ITALY_TRIP.dates} · ${fmtWeeks(ITALY_TRIP.weeks)} · £${ITALY_TRIP.budget} / week`} pill={italyCount} tone="brand" onPress={() => navigation.navigate('TripOffers', { tripId: 'italy' })} />

          <Text style={[styles.h2, { marginTop: 18 }]}>Coming up</Text>
          <View style={[styles.trip, WEB_SHADOW]}>
            <Image source={emmaListing ? photoFor(emmaListing.id) : undefined} style={styles.tripPhoto} resizeMode="cover" />
            <View style={styles.tripBody}>
              <Text style={styles.tripTitle}>{emmaListing?.title} · De Beauvoir</Text>
              <Text style={styles.tripDates}>{relRange(21, 28)} · 4 weeks · £{emmaListing?.pricePerWeek} / week</Text>
              <View style={styles.credit}>
                <Avatar id="bella" name="Nina" tint={world.memberById('bella').avatarColor} size={22} />
                <Text style={styles.creditText}>Nina made this match.</Text>
              </View>
            </View>
          </View>

          <Text style={styles.h2}>Past stays</Text>
          <View style={[styles.trip, WEB_SHADOW]}>
            <Image source={danicaListing ? photoFor(danicaListing.id) : undefined} style={styles.tripPhoto} resizeMode="cover" />
            <View style={styles.tripBody}>
              <Text style={styles.tripTitle}>{danicaListing?.title} · Tooting</Text>
              <Text style={styles.tripDates}>{relRange(-60, 21)} · 3 weeks</Text>
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
            <Text style={styles.unlockTitle}>Two trips cost the same as one</Text>
            <Text style={styles.unlockBody}>Every week someone covers your rent is a week you can be somewhere else. That's how a wedding back home, or a month in Lisbon, stops being a question of money.</Text>
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
          place={`Three weeks in Tooting, ${relRange(-60, 21)}.`}
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
  countText: { fontSize: 11.5, fontWeight: '700' },
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
  owedDone: { fontSize: 14, fontWeight: '700', color: color.textOnMint },
  owedBtn: { backgroundColor: color.brand, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  owedBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },
  card: { backgroundColor: color.surface, borderRadius: 20, padding: 20, gap: 10, ...WEB_SHADOW },
  cardTitle: { fontSize: 16, fontWeight: '700', color: color.ink },
  leaveRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  leaveVal: { fontSize: 22, fontWeight: '700', color: color.ink, width: 30 },
  leaveLabel: { fontSize: 14, color: color.inkSoft },
  leaveFoot: { fontSize: 12.5, color: color.inkFaint, marginTop: 4 },
  unlockCard: { backgroundColor: color.brandTint, borderRadius: 20, padding: 20, gap: 8 },
  unlockTitle: { fontSize: 16, fontWeight: '700', color: color.textOnMint },
  unlockBody: { fontSize: 14, lineHeight: 21, color: color.textOnMintSoft },
  openCard: { backgroundColor: color.surface, borderRadius: 20, padding: 18, paddingLeft: 21, gap: 8, overflow: 'hidden', ...WEB_SHADOW },
  caveatStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  openHeading: { fontSize: 13.5, fontWeight: '700', color: color.caveat },
  openRow: { fontSize: 14.5, lineHeight: 21, color: color.ink },
});
