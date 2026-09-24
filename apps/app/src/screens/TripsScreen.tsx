import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { TrustPill } from '../ui/TrustPill';
import { Dates, Keys } from '../ui/glyphs';
import { fmtWeeks } from '../domain/trips';
import { relRange } from '../domain/relDates';
import { useMyTrips } from '../api/trips';
import { useSession } from '../api/session';
import { color, font, radius, space, cardShadow } from '../theme/tokens';
import type { RootNav } from '../navigation';

// Trips, in Kiki’s own words: dates away, the stays coming up, and the ones behind you.
// Dates are relative to now so "coming up" is always ahead and "past" always behind.
const upcoming = { title: 'Maia’s Room · De Beauvoir', detail: '4 weeks · £44 / night', dates: relRange(21, 28) };
const past = [{ title: 'Danica’s Room · Tooting', detail: '3 weeks · £41 / night', dates: relRange(-60, 21), confirmed: true }];

export function TripsScreen() {
  const navigation = useNavigation<RootNav>();
  const { api } = useSession();
  const { trips } = useMyTrips(api);
  const canCover = (n: number) => `${n} ${n === 1 ? 'person' : 'people'} can cover it`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>Trips</Text>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Dates away</Text>
          <Pressable style={styles.planPill} onPress={() => navigation.navigate('PlanTrip')}><Text style={styles.planText}>Add a new trip</Text></Pressable>
        </View>
        {trips.map((t) => (
          <Pressable key={t.id} style={[styles.tripCard, cardShadow]} onPress={() => navigation.navigate('TripOffers', { tripId: t.id })}>
            <View style={styles.thumb}><Dates size={30} color={color.ink} /></View>
            <View style={styles.meta}><Text style={styles.title}>{t.name}</Text><Text style={styles.detail}>{t.dates} · {fmtWeeks(t.weeks)}</Text></View>
            {t.offers.length > 0 ? <TrustPill label={canCover(t.offers.length)} tone="solid" /> : <View style={styles.neutralPill}><Text style={styles.neutralPillText}>No offers yet</Text></View>}
          </Pressable>
        ))}

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
