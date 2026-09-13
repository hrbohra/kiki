import { View, Text, StyleSheet } from 'react-native';
import { color, radius } from '../theme/tokens';

interface Props {
  label: string;
  tone?: 'outline' | 'solid' | 'tint';
}

/**
 * Three tones map to three meanings, learned once:
 *  tint = status (degree, "in common") · outline = evidence (trust signals, past match) ·
 *  solid = confirmation ("Confirmed" only).
 */
export function TrustPill({ label, tone = 'outline' }: Props) {
  return (
    <View style={[styles.base, TONE[tone].box]}>
      <Text style={[styles.text, TONE[tone].text]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const TONE = {
  tint: { box: { backgroundColor: color.brandTint }, text: { color: color.textOnMint } },
  outline: { box: { borderWidth: 1, borderColor: color.brand, backgroundColor: 'transparent' }, text: { color: color.textOnMint } },
  solid: { box: { backgroundColor: color.brand }, text: { color: '#FFFFFF' } },
} as const;

const styles = StyleSheet.create({
  base: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '800' },
});
