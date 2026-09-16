import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { TierBadge } from '../../ui/TierBadge';
import { WEB_SHADOW } from './webBits';
import { FactsEditor } from '../../ui/FactsEditor';
import { useWorldVersion } from '../../api/world-provider';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';
import type { RootNav } from '../../navigation';


/** Me — how a member sees their own standing. Keeps points/rank/tier (per product choice) and
 *  adds the provenance tags and the consent card the Trust tab relies on. */
export function MeWeb() {
  const navigation = useNavigation<RootNav>();
  useWorldVersion(); // re-render when your facts change
  const me = world.memberById(world.viewerId);
  const standing = world.standingOf(me.id);
  const cohort = world.leaderboard().length;
  const similar = world.peopleLikeYou().length;

  return (
    <View style={{ gap: 20 }}>
      <View style={styles.hero}>
        <Avatar id={me.id} name={me.name} tint={me.avatarColor} country={me.country} size={72} ring ringColor={color.gold} />
        <View>
          <Text style={styles.name}>You</Text>
          <Text style={styles.headline}>You've vouched for 4 people. Three of them have hosted since.</Text>
        </View>
      </View>

      <View style={styles.cols}>
        <View style={styles.col}>
          <Text style={styles.h2}>Your standing</Text>
          <View style={[styles.card, WEB_SHADOW]}>
            <View style={styles.badgeRow}><TierBadge standing={standing} showRank gold /></View>
            <View style={styles.tiles}>
              <Tile value={`${standing.score}`} label="points" />
              <Tile value={`#${standing.rank}`} label={`of ${cohort}`} />
              <Tile value={`${similar}`} label="like you" />
            </View>
            <Text style={styles.foot}>Recent contributions count for more — your standing reflects the last few months.</Text>
          </View>

          <Text style={styles.h2}>What you've done</Text>
          <View style={[styles.card, WEB_SHADOW]}>
            <Act label="Hosted" n={0} />
            <Act label="Vouched" n={4} />
            <Act label="Referred" n={1} />
            <Act label="Showed up" n={3} />
          </View>
          <Text style={styles.foot}>You've never hosted. That's the one gap a host will notice, and the one you can close.</Text>

          <Text style={styles.h2}>How you got in</Text>
          <Pressable style={({ hovered }: any) => [styles.card, styles.inviteCard, hovered && styles.inviteHover]} onPress={() => navigation.navigate('Onboard')}>
            <Text style={styles.inviteText}>Nina invited you in July. Her name is still attached to yours.</Text>
            <Text style={styles.inviteCta}>See your invite ›</Text>
          </Pressable>
        </View>

        <View style={styles.col}>
          <Text style={styles.h2}>What we match you on</Text>
          <View style={[styles.card, WEB_SHADOW]}>
            <FactsEditor traits={me.traits} title="Your facts" compact />
          </View>

          <View style={styles.consentCard}>
            <View style={styles.caveatStrip} />
            <Text style={styles.consentHeading}>What other people can see</Text>
            <Text style={styles.consentRow}>You're shown as a voucher on the trust pages of people you've vouched for. You can turn that off per person.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return <View style={styles.tile}><Text style={styles.tileVal}>{value}</Text><Text style={styles.tileLabel}>{label}</Text></View>;
}
function Act({ label, n }: { label: string; n: number }) {
  return (
    <View style={styles.actRow}>
      <Text style={styles.actLabel}>{label}</Text>
      <View style={styles.actTrack}><View style={[styles.actFill, { width: `${Math.min(100, 10 + n * 18)}%` as const }]} /></View>
      <Text style={styles.actNum}>{n}</Text>
    </View>
  );
}
function traitPlain(label: string): string {
  return label.replace(/^bouldering at /, '').replace(/^the /, '');
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  name: { fontSize: 28, fontWeight: '700', letterSpacing: -0.6, color: color.ink },
  headline: { fontSize: 16, color: color.inkSoft, marginTop: 2, maxWidth: 520 },
  cols: { flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },
  col: { flex: 1, minWidth: 320, gap: 16 },
  h2: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  card: { backgroundColor: color.surface, borderRadius: 20, padding: 20, gap: 12, ...WEB_SHADOW },
  inviteCard: { gap: 10 },
  inviteHover: { transform: [{ translateY: -2 }] },
  inviteText: { fontSize: 14.5, lineHeight: 21, color: color.ink },
  inviteCta: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
  badgeRow: { flexDirection: 'row' },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, backgroundColor: color.screen, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  tileVal: { fontSize: 21, fontWeight: '700', color: color.ink },
  tileLabel: { fontSize: 12.5, color: color.inkFaint },
  foot: { fontSize: 12.5, color: color.inkFaint },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actLabel: { width: 92, fontSize: 14.5, fontWeight: '600', color: color.inkSoft },
  actTrack: { flex: 1, height: 10, borderRadius: radius.pill, backgroundColor: '#E4EAE8', overflow: 'hidden' },
  actFill: { height: 10, borderRadius: radius.pill, backgroundColor: color.brand },
  actNum: { width: 20, textAlign: 'right', fontSize: 14.5, fontWeight: '700', color: color.ink },
  traitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  traitIcon: { fontSize: 18 },
  traitLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: color.ink },
  provTag: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  provWords: { backgroundColor: color.brandTint },
  provWorked: { borderWidth: 1, borderStyle: 'dashed', borderColor: color.dashedTint },
  provText: { fontSize: 11.5, fontWeight: '700' },
  provWordsText: { color: color.textOnMint },
  provWorkedText: { color: color.textOnMintSoft },
  consentCard: { backgroundColor: color.surface, borderRadius: 20, padding: 20, paddingLeft: 23, gap: 8, overflow: 'hidden', ...WEB_SHADOW },
  caveatStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  consentHeading: { fontSize: 13.5, fontWeight: '700', color: color.caveat },
  consentRow: { fontSize: 14.5, lineHeight: 21, color: color.ink },
});
