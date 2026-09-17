import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { TierBadge } from '../ui/TierBadge';
import { color, font, radius, space, shadow } from '../theme/tokens';
import { plural } from '../domain/format';
import * as world from '../world';
import type { RootNav } from '../navigation';

/** Community tab: similarity ("people like you"), who you brought in, and giving back — tiers as words, no rank. */
export function CommunityScreen() {
  const navigation = useNavigation<RootNav>();
  const similar = world.peopleLikeYou();
  const board = world.leaderboard();
  const branch = world.inviteBranch();
  const branchStays = branch.reduce((n, p) => n + p.stays + p.hosted, 0);

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

        <Text style={styles.section}>Who you brought in</Text>
        <Text style={styles.lead}>{branch.length ? `${plural(branch.length, 'person', 'people')} · ${plural(branchStays, 'stay')}` : 'Nobody yet. The invite tree is the graph’s backbone.'}</Text>
        {branch.length ? (
          <View style={[styles.card, shadow.card]}>
            {branch.map((p, i) => (
              <Pressable key={p.member.id} onPress={() => openMember(p.member.id)} style={[styles.row, i > 0 && styles.rowDivider]} accessibilityRole="button" accessibilityLabel={`${p.member.name}. ${branchSummary(p)} ${p.tier}.`}>
                <Avatar id={p.member.id} name={p.member.name} tint={p.member.avatarColor} country={p.member.country} size={40} />
                <View style={styles.rowMeta}>
                  <Text style={styles.name}>{p.member.name.split(' ')[0]}</Text>
                  <Text style={styles.trait}>{branchSummary(p)}</Text>
                </View>
                <View style={[styles.tierChip, p.tier === 'Newcomer' && styles.tierChipNew]}><Text style={[styles.tierChipText, p.tier === 'Newcomer' && styles.tierChipTextNew]}>{p.tier === 'Newcomer' ? 'New' : p.tier}</Text></View>
              </Pressable>
            ))}
            <Text style={styles.branchFoot}>Your name is on each of them. When they host well, it shows up here and on your standing.</Text>
          </View>
        ) : null}

        <Text style={styles.section}>Giving back</Text>
        <Text style={styles.lead}>Hosting, vouching, referring, showing up. Recent counts more; nobody is ranked.</Text>
        <View style={[styles.card, shadow.card]}>
          {board.slice(0, 8).map((s, i) => {
            const m = world.memberById(s.memberId);
            return (
              <Pressable key={s.memberId} onPress={() => openMember(s.memberId)} style={[styles.row, i > 0 && styles.rowDivider]} accessibilityRole="button" accessibilityLabel={`${m.id === world.viewerId ? 'You' : m.name}, ${s.tier}`}>
                <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={m.country} size={38} />
                <View style={styles.rowMeta}>
                  <Text style={styles.name}>{m.id === world.viewerId ? 'You' : m.name}</Text>
                  <TierBadge standing={s} inline />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  tierChip: { backgroundColor: color.brandTint, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  tierChipNew: { backgroundColor: color.hairlineSoft },
  tierChipText: { fontSize: 11, fontWeight: '700', color: color.textOnMint },
  tierChipTextNew: { color: color.inkFaint },
  branchFoot: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint, paddingVertical: 12 },
});
