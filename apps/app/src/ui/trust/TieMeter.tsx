import { View, StyleSheet } from 'react-native';
import { color } from '../../theme/tokens';

/**
 * Three bars showing how well the viewer knows one connection — filled from measured stay +
 * event counts, never a guessed closeness score. Decorative to assistive tech (the reason is
 * spelled out in words beside it).
 */
export function TieMeter({ strength }: { strength: 1 | 2 | 3 }) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.bar, { backgroundColor: i <= strength ? color.trust1 : color.tieEmpty }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  bar: { width: 9, height: 4, borderRadius: 2 },
});
