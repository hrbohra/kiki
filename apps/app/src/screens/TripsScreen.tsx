import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { TrustPill } from '../ui/TrustPill';
import { Dates, Keys } from '../ui/glyphs';
import { ITALY_TRIP, fmtWeeks } from '../domain/trips';
import { relRange } from '../domain/relDates';
import { useCreatedTrip } from '../demo/createdTrip';
import { color, font, radius, space, cardShadow } from '../theme/tokens';
import type { RootNav } from '../navigation';

// Away: your place while you are gone, the stays you have coming up, and the ones behind you.
// Dates are relative to now so "coming up" is always ahead and "past" always behind.
const upcoming = { title: 'Maia’s Room · De Beauvoir', detail: '4 weeks · £310 / week', dates: relRange(21, 28) };
const past = [{ title: 'Danica’s Room · Tooting', detail: '3 weeks · £285 / week', dates: relRange(-60, 21), confirmed: true }];

export function TripsScreen() {
  const navigation = useNavigation<RootNav>();
  const created = useCreatedTrip();
  const italyCount = `${ITALY_TRIP.offers.length} ${ITALY_TRIP.offers.length === 1 ? 'person' : 'people'} can cover it`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>Away</Text>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Looking for a Kikier</Text>
          <Pressable style={styles.planPill} onPress={() => navigation.navigate('PlanTrip')}><Text style={styles.planText}>List my place</Text></Pressable>
        </View>
        {created ? (
          <Pressable style={[styles.tripCard, cardShadow]} onPress={() => navigation.navigate('TripOffers', { tripId: 'created' })}>
            <View style={styles.thumb}><Dates size={30} color={color.ink} /></View>
            <View style={styles.meta}><Text style={styles.title}>{created.name}</Text><Text style={styles.detail}>{created.dates} · {fmtWeeks(created.weeks)}</Text></View>
            <View style={styles.neutralPill}><Text style={styles.neutralPillText}>No offers yet</Text></View>
          </Pressable>
        ) : null}
        <Pressable style={[styles.tripCard, cardShadow]} onPress={() => navigation.navigate('TripOffers', { tripId: 'italy' })}>
          <View style={styles.thumb}><Dates size={30} color={color.ink} /></View>
          <View style={styles.meta}><Text style={styles.title}>{ITALY_TRIP.name}</Text><Text style={styles.detail}>{ITALY_TRIP.dates} · {fmtWeeks(ITALY_TRIP.weeks)}</Text></View>
          <TrustPill label={italyCount} tone="solid" />
        </Pressable>

        <Text style={styles.section}>Coming up</Text>
        <View style={[styles.tripCard, cardShadow]}>
          <View style={styles.thumb}><Keys size={30} color={color.ink} /></View>
          <View style={styles.meta}>
            <Text style={styles.title}>{upcoming.title}</Text>
            <Text style={styles.detail}>{upcoming.detail}</Text>
            <Text style={styles.detail}>{upcoming.dates}</Text>
          </View>
        </View>

        <Text style={styles.section}>Past stays</Text>
        {past.map((t) => (
          <View key={t.title} style={[styles.tripCard, cardShadow]}>
            <View style={styles.thumb}><Keys size={30} color={color.ink} /></View>
            <View style={styles.meta}>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.detail}>{t.detail}</Text>
              <Text style={styles.detail}>{t.dates}</Text>
            </View>
            {t.confirmed ? <TrustPill label="Confirmed" tone="solid" /> : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  body: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  h1: { ...font.display },
  tripCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.surface, borderRadius: radius.md, padding: space.md },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1, gap: 2 },
  title: { ...font.h3 },
  detail: { ...font.body },
  section: { ...font.h2, marginTop: space.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md },
  planPill: { borderWidth: 1, borderColor: color.brand, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  planText: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
  neutralPill: { backgroundColor: color.hairlineSoft, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 5 },
  neutralPillText: { fontSize: 11.5, fontWeight: '700', color: color.inkFaint },
});
