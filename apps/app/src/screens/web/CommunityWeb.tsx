import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { TierBadge } from '../../ui/TierBadge';
import { WEB_SHADOW } from './webBits';
import { color, radius } from '../../theme/tokens';
import { plural } from '../../domain/format';
import * as world from '../../world';
import type { RootNav } from '../../navigation';

/** Community — similarity + the contribution leaderboard (kept, with tier badges). */
export function CommunityWeb() {
  const navigation = useNavigation<RootNav>();
  const similar = world.peopleLikeYou();
  const board = world.leaderboard();
  const branch = world.inviteBranch();
  const branchStays = branch.reduce((n, p) => n + p.stays + p.hosted, 0);
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

          <Text style={[styles.h2, { marginTop: 28 }]}>Who you brought in</Text>
          <View style={[styles.card, WEB_SHADOW]}>
            <Text style={styles.branchMeta}>{branch.length ? `${plural(branch.length, 'person', 'people')} · ${plural(branchStays, 'stay')}` : 'Nobody yet. The invite tree is the graph’s backbone.'}</Text>
            {branch.map((p) => (
              <Pressable key={p.member.id} onPress={() => open(p.member.id)} style={[styles.row, styles.divider]} accessibilityRole="button" accessibilityLabel={`${p.member.name}. ${branchSummary(p)} ${p.tier}.`}>
                <Avatar id={p.member.id} name={p.member.name} tint={p.member.avatarColor} country={p.member.country} size={40} />
                <View style={styles.meta}>
                  <Text style={styles.name}>{p.member.name.split(' ')[0]}</Text>
                  <Text style={styles.trait}>{branchSummary(p)}</Text>
                </View>
                <View style={[styles.tierChip, p.tier === 'Newcomer' && styles.tierChipNew]}><Text style={[styles.tierChipText, p.tier === 'Newcomer' && styles.tierChipTextNew]}>{p.tier === 'Newcomer' ? 'New' : p.tier}</Text></View>
              </Pressable>
            ))}
            <Text style={styles.branchFoot}>Your name is on each of them. When they host well, it shows up here and on your standing.</Text>
          </View>
        </View>

        {/* Giving back — leaderboard kept */}
        <View style={styles.col}>
          <Text style={styles.h2}>Giving back</Text>
          <View style={[styles.card, WEB_SHADOW]}>
            {board.slice(0, 8).map((s, i) => {
              const m = world.memberById(s.memberId);
              return (
                <Pressable key={s.memberId} onPress={() => open(s.memberId)} style={[styles.row, i > 0 && styles.divider]} accessibilityRole="button" accessibilityLabel={`${m.id === world.viewerId ? 'You' : m.name}, ${s.tier}`}>
                  <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={m.country} size={40} />
                  <View style={styles.meta}>
                    <Text style={styles.name}>{m.id === world.viewerId ? 'You' : m.name}</Text>
                    <TierBadge standing={s} inline />
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.foot}>Hosting, vouching, referring, showing up. Recent counts more; nobody is ranked.</Text>
        </View>
      </View>
    </View>
  );
}

function branchSummary(p: { hosted: number; stays: number; invited: number }): string {
  const parts: string[] = [];
  if (p.hosted) parts.push(`Hosted ${p.hosted}`);
  if (p.invited) parts.push(`brought in ${p.invited} more`);
  if (p.stays) parts.push(`stayed ${p.stays === 1 ? 'once' : `${p.stays} times`}`);
  if (!parts.length) return 'Nothing yet, that’s normal.';
  const line = parts.join(', ');
  return line.charAt(0).toUpperCase() + line.slice(1) + '.';
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
  tierChip: { backgroundColor: color.brandTint, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  tierChipNew: { backgroundColor: color.hairlineSoft },
  tierChipText: { fontSize: 11, fontWeight: '700', color: color.textOnMint },
  tierChipTextNew: { color: color.inkFaint },
  branchMeta: { fontSize: 13, fontWeight: '600', color: color.inkFaint, paddingTop: 14 },
  branchFoot: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint, paddingVertical: 12 },
  foot: { fontSize: 12.5, color: color.inkFaint, marginTop: 10 },
});
