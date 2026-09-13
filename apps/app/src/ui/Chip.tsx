import { Pressable, Text, StyleSheet } from 'react-native';
import { color, radius } from '../theme/tokens';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  readOnly?: boolean; // tag chips (profile/listing): a label, not a control
}

/** Filter chip: filled teal when active. Read-only tag chips sit on bg and never press. */
export function Chip({ label, active = false, onPress, readOnly = false }: Props) {
  if (readOnly) {
    return (
      <Text style={[styles.chip, styles.readOnly, styles.text, styles.textInactive]}>{label}</Text>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.active : styles.inactive,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  active: { backgroundColor: color.brand, borderColor: color.brand },
  inactive: { backgroundColor: color.surface, borderColor: color.hairline },
  readOnly: { backgroundColor: color.bg, borderColor: color.hairline, overflow: 'hidden' },
  text: { fontSize: 13, fontWeight: '700' },
  textActive: { color: '#FFFFFF' },
  textInactive: { color: color.inkSoft },
});
