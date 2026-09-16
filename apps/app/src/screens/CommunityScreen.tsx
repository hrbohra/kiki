import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { TierBadge } from '../ui/TierBadge';
import { color, font, radius, space, shadow } from '../theme/tokens';
import * as world from '../world';
import type { RootNav } from '../navigation';

/** Community tab: similarity ("people like you") + the contribution leaderboard. */
export function CommunityScreen() {
  const navigation = useNavigation<RootNav>();
  const similar = world.peopleLikeYou();
  const board = world.leaderboard();

  const openMember = (memberId: string) => {
    const listing = world.listingForHost(memberId);
    if (listing) navigation.navigate('HostProfile', { listingId: listing.id });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>Community</Text>

        <Text style={styles.section}>People like you</Text>
        <Text style={styles.lead}>Members you share the most with, surfaced by similarity matching.</Text>
        <View style={[styles.card, shadow.card]}>
          {similar.map(({ member, overlaps }, i) => (
            <Pressable key={member.id} onPress={() => openMember(member.id)} style={[styles.row, i > 0 && styles.rowDivider]}>
              <Avatar id={member.id} name={member.name} tint={member.avatarColor} country={member.country} size={42} />
              <View style={styles.rowMeta}>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={styles.trait} numberOfLines={1}>{overlaps[0].label}</Text>
              </View>
              <View style={styles.inCommon}>
                <Text style={styles.inCommonNum}>{overlaps.length}</Text>
                <Text style={styles.inCommonLabel}>in common</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Top contributors</Text>
        <Text style={styles.lead}>Ranked by giving back — hosting, vouching, referring, showing up. Recent counts more.</Text>
        <View style={[styles.card, shadow.card]}>
          {board.slice(0, 8).map((s, i) => {
            const m = world.memberById(s.memberId);
            const top3 = s.rank <= 3;
            return (
              <Pressable key={s.memberId} onPress={() => openMember(s.memberId)} style={[styles.row, i > 0 && styles.rowDivider]}>
                <Text style={[styles.rank, top3 && styles.rankTop]}>{s.rank}</Text>
                <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={m.country} size={38} />
                <View style={styles.rowMeta}>
                  <Text style={styles.name}>{m.id === world.viewerId ? 'You' : m.name}</Text>
                  <TierBadge standing={s} inline />
                </View>
                <View style={styles.scoreCol}>
                  <Text style={styles.score}>{s.score}</Text>
                  <Text style={styles.scoreLabel}>points</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  body: { padding: space.screen, paddingBottom: space.xxl, gap: space.sm },
  h1: { ...font.display },
  section: { ...font.h3, marginTop: space.lg },
  lead: { ...font.caption, marginTop: -2, marginBottom: space.xs },
  card: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.hairline, paddingHorizontal: space.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowDivider: { borderTopWidth: 1, borderTopColor: color.hairlineSoft },
  rowMeta: { flex: 1, gap: 3 },
  name: { fontSize: 16, fontWeight: '700', color: color.ink },
  trait: { ...font.caption },
  inCommon: { alignItems: 'center', backgroundColor: color.brandTint, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 6 },
  inCommonNum: { fontSize: 18, fontWeight: '700', color: color.textOnMint },
  inCommonLabel: { fontSize: 10, fontWeight: '700', color: color.textOnMint },
  rank: { width: 22, textAlign: 'center', fontSize: 15, fontWeight: '700', color: color.inkFaint },
  rankTop: { color: '#C98A2B' },
  scoreCol: { alignItems: 'flex-end' },
  score: { fontSize: 16, fontWeight: '700', color: color.ink },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: color.inkFaint },
});
