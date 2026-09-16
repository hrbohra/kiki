import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../ui/Avatar';
import { TierBadge } from '../ui/TierBadge';
import { PressableScale } from '../ui/PressableScale';
import { useResponsive } from '../ui/useResponsive';
import { resetOnboarded } from '../demo/onboarding';
import { FactsEditor } from '../ui/FactsEditor';
import { useWorldVersion } from '../api/world-provider';
import { useSession } from '../api/session';
import { color, font, radius, space, shadow } from '../theme/tokens';
import type { RootNav } from '../navigation';
import * as world from '../world';

/** The viewer's own profile: identity, standing, and the facts that drive their matches. */
export function MeScreen() {
  const me = world.memberById(world.viewerId);
  const standing = world.standingOf(me.id);
  const cohort = world.leaderboard().length;
  const similarCount = world.peopleLikeYou().length;
  const navigation = useNavigation<RootNav>();
  const { isWide } = useResponsive();
  const { api } = useSession();
  useWorldVersion(); // re-render when your facts change

  const replayDemo = () => {
    api.demo.reset.mutate().catch(() => {}); // put the seeded requests back for the next visitor
    resetOnboarded();
    navigation.navigate('Onboard');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, shadow.card]}>
          <Avatar id={me.id} name={me.name} tint={me.avatarColor} country={me.country} size={76} ring ringColor={color.gold} />
          <Text style={styles.name}>You</Text>
          <TierBadge standing={standing} showRank gold />
        </View>

        <View style={styles.tiles}>
          <Tile value={`${standing.score}`} label="points" />
          <Tile value={`#${standing.rank}`} label={`of ${cohort}`} />
          <Tile value={`${similarCount}`} label="like you" />
        </View>
        <Text style={styles.decay}>Recent contributions count for more — your standing reflects the last few months, not all time.</Text>

        <View style={[styles.card, shadow.card]}>
          <FactsEditor traits={me.traits} />
        </View>

        {/* Demo-only affordance to replay the invite flow. Mobile only — on desktop the same action
            lives in the floating "Reset demo" pill, so we don't show it twice. */}
        {!isWide && (
          <PressableScale style={styles.replay} onPress={replayDemo} accessibilityRole="button" accessibilityLabel="Replay demo">
            <Text style={styles.replayText}>⟲  Replay the demo</Text>
            <Text style={styles.replaySub}>Start again from Nina's invite</Text>
          </PressableScale>
        )}
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
  body: { padding: space.screen, paddingBottom: space.xxl, gap: space.md },
  hero: { backgroundColor: color.surface, borderRadius: radius.hero, padding: space.xl, alignItems: 'center', gap: space.sm },
  name: { ...font.h2 },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, paddingVertical: space.md, alignItems: 'center' },
  tileValue: { fontSize: 22, fontWeight: '700', color: color.ink },
  tileLabel: { ...font.caption },
  decay: { ...font.caption, lineHeight: 18 },
  card: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.hairline, padding: space.card, gap: space.sm },
  cardTitle: { ...font.h3 },
  traitRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  traitIcon: { fontSize: 18 },
  traitLabel: { ...font.body, color: color.ink, fontWeight: '600' },
  replay: { backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, paddingVertical: space.md, paddingHorizontal: space.card, alignItems: 'center', gap: 2, marginTop: space.sm },
  replayText: { ...font.body, color: color.inkFaint, fontWeight: '700' },
  replaySub: { ...font.caption, color: color.inkFaint },
});
