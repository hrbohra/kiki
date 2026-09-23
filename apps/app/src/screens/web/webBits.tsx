import { View, Text, StyleSheet } from 'react-native';
import { stepsFromYou } from '../../domain/format';
import { color, radius } from '../../theme/tokens';

/** Card elevation used across the web pages (no border — teal/brick strips stay the only edges). */
export const WEB_SHADOW = {
  shadowColor: '#1A1A1A', shadowOpacity: 0.05, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 2,
};

/** Social distance as a sentence — "steps", never "degree". Past three it stops meaning much. */
export function reachText(deg: number): string {
  if (!Number.isFinite(deg)) return 'Not connected yet';
  if (deg <= 0) return 'This is you';
  return stepsFromYou(deg);
}

export function ReachPill({ deg }: { deg: number }) {
  const one = deg === 1;
  const near = Number.isFinite(deg) && deg <= 2;
  return (
    <View style={[styles.pill, near ? styles.near : styles.far, one && styles.oneBorder]}>
      <Text style={[styles.text, near ? styles.textNear : styles.textFar]}>{reachText(deg)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 5 },
  near: { backgroundColor: color.brandTint },
  oneBorder: { borderWidth: 1, borderColor: color.brand },
  far: { backgroundColor: color.bg },
  text: { fontSize: 12.5, fontWeight: '700' },
  textNear: { color: color.textOnMint },
  textFar: { color: color.inkFaint },
});
