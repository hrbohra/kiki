import { View, Text, StyleSheet } from 'react-native';
import { color, radius, tierColor } from '../theme/tokens';
import type { MemberStanding } from '../pipeline/tiering';

interface Props {
  standing: MemberStanding;
  showRank?: boolean; // append "· #rank"
  inline?: boolean; // dense lists: drop the border, keep dot + label
  gold?: boolean; // your own standing only
}

/**
 * A coloured dot + label ("Pillar · #1"): one dot in four colours carries the tier, letting
 * the colour do the talking instead of four mismatched emoji.
 */
export function TierBadge({ standing, showRank = false, inline = false, gold = false }: Props) {
  const tint = gold ? color.gold : tierColor[standing.tier];
  return (
    <View style={[styles.badge, inline ? styles.inline : { borderColor: tint }]}>
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <Text style={[styles.label, { color: tint }]}>
        {standing.tier}
        {showRank ? ` · #${standing.rank}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  inline: { borderWidth: 0, paddingHorizontal: 0, paddingVertical: 0 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 11, fontWeight: '700' },
});
