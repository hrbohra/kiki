import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { TrustPill } from '../ui/TrustPill';
import { Dates } from '../ui/glyphs';
import { ITALY_TRIP } from '../domain/trips';
import { useCreatedTrip } from '../demo/createdTrip';
import { color, font, radius, space, cardShadow } from '../theme/tokens';
import type { RootNav } from '../navigation';

// Recreates Kiki's real Trips screen for continuity of the demo (static data).
const upcoming = { emoji: '✈️', title: 'Trip', detail: '1 night @ £47/night', dates: '30 – 31 Jul' };
const past = [{ emoji: '🎂', title: 'Bday', detail: '4 nights @ £45/night', dates: '23 – 27 Apr', confirmed: true }];

export function TripsScreen() {
  const navigation = useNavigation<RootNav>();
  const created = useCreatedTrip();
  const italyCount = `${ITALY_TRIP.offers.length} ${ITALY_TRIP.offers.length === 1 ? 'offer' : 'offers'}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>Kiki Trips</Text>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Out for offers</Text>
          <Pressable style={styles.planPill} onPress={() => navigation.navigate('PlanTrip')}><Text style={styles.planText}>Plan a trip</Text></Pressable>
        </View>
        {created ? (
          <Pressable style={[styles.tripCard, cardShadow]} onPress={() => navigation.navigate('TripOffers', { tripId: 'created' })}>
            <View style={styles.thumb}><Dates size={30} color={color.ink} /></View>
            <View style={styles.meta}><Text style={styles.title}>{created.name}</Text><Text style={styles.detail}>{created.dates} · {created.nights} nights</Text></View>
            <View style={styles.neutralPill}><Text style={styles.neutralPillText}>No offers yet</Text></View>
          </Pressable>
        ) : null}
        <Pressable style={[styles.tripCard, cardShadow]} onPress={() => navigation.navigate('TripOffers', { tripId: 'italy' })}>
          <View style={styles.thumb}><Dates size={30} color={color.ink} /></View>
          <View style={styles.meta}><Text style={styles.title}>{ITALY_TRIP.name}</Text><Text style={styles.detail}>{ITALY_TRIP.dates} · {ITALY_TRIP.nights} nights</Text></View>
          <TrustPill label={italyCount} tone="solid" />
        </Pressable>

        <Text style={styles.section}>Coming up</Text>
        <View style={[styles.tripCard, cardShadow]}>
          <View style={styles.thumb}><Text style={styles.emoji}>{upcoming.emoji}</Text></View>
          <View style={styles.meta}>
            <Text style={styles.title}>{upcoming.title}</Text>
            <Text style={styles.detail}>{upcoming.detail}</Text>
            <Text style={styles.detail}>{upcoming.dates}</Text>
          </View>
        </View>

        <Text style={styles.section}>Past trips</Text>
        {past.map((t) => (
          <View key={t.title} style={[styles.tripCard, cardShadow]}>
            <View style={styles.thumb}><Text style={styles.emoji}>{t.emoji}</Text></View>
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
  body: { padding: space.lg, gap: space.md },
  h1: { ...font.display },
  tripCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.surface, borderRadius: radius.md, padding: space.md },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 30 },
  meta: { flex: 1, gap: 2 },
  title: { ...font.h3 },
  detail: { ...font.body },
  section: { ...font.h2, marginTop: space.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md },
  planPill: { borderWidth: 1, borderColor: color.brand, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  planText: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
  neutralPill: { backgroundColor: color.hairlineSoft, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 5 },
  neutralPillText: { fontSize: 11.5, fontWeight: '800', color: color.inkFaint },
});
