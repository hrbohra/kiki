import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { TierBadge } from '../../ui/TierBadge';
import { WEB_SHADOW } from './webBits';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';
import type { RootNav } from '../../navigation';

/** Community — similarity + the contribution leaderboard (kept, with tier badges). */
export function CommunityWeb() {
  const navigation = useNavigation<RootNav>();
  const similar = world.peopleLikeYou();
  const board = world.leaderboard();
  const open = (memberId: string) => {
    const l = world.listingForHost(memberId);
    if (l) navigation.navigate('HostProfile', { listingId: l.id });
  };

  return (
    <View style={{ gap: 20 }}>
      <Text style={styles.h1}>Community</Text>
      <View style={styles.cols}>
        {/* People like you */}
        <View style={styles.col}>
          <Text style={styles.h2}>People like you</Text>
          <View style={[styles.card, WEB_SHADOW]}>
            {similar.map(({ member, overlaps }, i) => (
              <Pressable key={member.id} onPress={() => open(member.id)} style={[styles.row, i > 0 && styles.divider]}>
                <Avatar id={member.id} name={member.name} tint={member.avatarColor} country={member.country} size={44} />
                <View style={styles.meta}>
                  <Text style={styles.name}>{member.name}</Text>
                  <Text style={styles.trait} numberOfLines={1}>{overlaps.map((o) => shortTrait(o.label)).join(' · ')}</Text>
                </View>
                <View style={styles.countTile}><Text style={styles.countNum}>{overlaps.length}</Text><Text style={styles.countLabel}>in common</Text></View>
              </Pressable>
            ))}
          </View>
          <Text style={styles.foot}>Shared facts, not a compatibility score.</Text>
        </View>

        {/* Giving back — leaderboard kept */}
        <View style={styles.col}>
          <Text style={styles.h2}>Giving back</Text>
          <View style={[styles.card, WEB_SHADOW]}>
            {board.slice(0, 8).map((s, i) => {
              const m = world.memberById(s.memberId);
              const top3 = s.rank <= 3;
              return (
                <Pressable key={s.memberId} onPress={() => open(s.memberId)} style={[styles.row, i > 0 && styles.divider]}>
                  <Text style={[styles.rank, top3 && styles.rankTop]}>{s.rank}</Text>
                  <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={m.country} size={40} />
                  <View style={styles.meta}>
                    <Text style={styles.name}>{m.id === world.viewerId ? 'You' : m.name}</Text>
                    <TierBadge standing={s} inline />
                  </View>
                  <View style={styles.scoreCol}><Text style={styles.score}>{s.score}</Text><Text style={styles.scoreLabel}>points</Text></View>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.foot}>Ranked by giving back — hosting, vouching, referring, showing up. Recent counts more.</Text>
        </View>
      </View>
    </View>
  );
}

function shortTrait(label: string): string {
  return label.replace(/^You (both |were both )?(moved to London from |studied at |are both into |were both at )?/i, '');
}

const styles = StyleSheet.create({
  h1: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, color: color.ink },
  h2: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2, color: color.ink, marginBottom: 12 },
  cols: { flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },
  col: { flex: 1, minWidth: 320 },
  card: { backgroundColor: color.surface, borderRadius: 20, paddingHorizontal: 16, ...WEB_SHADOW },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: color.hairlineSoft },
  meta: { flex: 1, gap: 3 },
  name: { fontSize: 16, fontWeight: '700', color: color.ink },
  trait: { fontSize: 13, color: color.inkFaint },
  countTile: { alignItems: 'center', backgroundColor: color.brandTint, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  countNum: { fontSize: 17, fontWeight: '700', color: color.textOnMint },
  countLabel: { fontSize: 10, fontWeight: '700', color: color.textOnMint },
  rank: { width: 22, textAlign: 'center', fontSize: 15, fontWeight: '700', color: color.inkFaint },
  rankTop: { color: '#C98A2B' },
  scoreCol: { alignItems: 'flex-end' },
  score: { fontSize: 16, fontWeight: '700', color: color.ink },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: color.inkFaint },
  foot: { fontSize: 12.5, color: color.inkFaint, marginTop: 10 },
});
