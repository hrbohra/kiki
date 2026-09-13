import { Pressable, Text, StyleSheet } from 'react-native';
import { color, radius } from '../../theme/tokens';

/**
 * A tappable count ("2 mutuals", "4 guest book entries", "1 past match"). A clean teal-outlined
 * chip that fills with brandTint on press — navigational, quiet, and consistent with the rest of
 * the trust surface. (An earlier gold-sheen treatment read as a muddy hue over mint cards.)
 */
export function CountPill({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { borderWidth: 1, borderColor: color.brand, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 5 },
  pressed: { backgroundColor: color.brandTint },
  text: { fontSize: 12, fontWeight: '700', color: color.textOnMint },
});
