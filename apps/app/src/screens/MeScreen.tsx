import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { TierBadge } from '../ui/TierBadge';
import { color, font, radius, space, shadow } from '../theme/tokens';
import * as world from '../world';

/** The viewer's own profile: identity, standing, and the facts that drive their matches. */
export function MeScreen() {
  const me = world.memberById(world.viewerId);
  const standing = world.standingOf(me.id);
  const cohort = world.leaderboard().length;
  const similarCount = world.peopleLikeYou().length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, shadow.card]}>
          <Avatar id={me.id} name={me.name} tint={me.avatarColor} country={me.country} size={76} ring />
          <Text style={styles.name}>You</Text>
          <TierBadge standing={standing} showRank />
        </View>

        <View style={styles.tiles}>
          <Tile value={`${standing.score}`} label="points" />
          <Tile value={`#${standing.rank}`} label={`of ${cohort}`} />
          <Tile value={`${similarCount}`} label="like you" />
        </View>
        <Text style={styles.decay}>Recent contributions count for more — your standing reflects the last few months, not all time.</Text>

        <View style={[styles.card, shadow.card]}>
          <Text style={styles.cardTitle}>What you're matched on</Text>
          {me.traits.map((t) => (
            <View key={t.key} style={styles.traitRow}>
              <Text style={styles.traitLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <View style={[styles.tile, shadow.card]}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  body: { padding: space.screen, gap: space.md },
  hero: { backgroundColor: color.surface, borderRadius: radius.hero, padding: space.xl, alignItems: 'center', gap: space.sm },
  name: { ...font.h2 },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, paddingVertical: space.md, alignItems: 'center' },
  tileValue: { fontSize: 22, fontWeight: '800', color: color.ink },
  tileLabel: { ...font.caption },
  decay: { ...font.caption, lineHeight: 18 },
  card: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.hairline, padding: space.card, gap: space.sm },
  cardTitle: { ...font.h3 },
  traitRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  traitIcon: { fontSize: 18 },
  traitLabel: { ...font.body, color: color.ink, fontWeight: '600' },
});
