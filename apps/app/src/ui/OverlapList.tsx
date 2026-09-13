import { View, Text, StyleSheet } from 'react-native';
import { color, font, radius, space } from '../theme/tokens';
import { TRAIT_GLYPH } from './glyphs';
import type { Overlap } from '../domain/types';

/** The "reading between the lines" list: what you and the host share. */
export function OverlapList({ overlaps }: { overlaps: Overlap[] }) {
  if (overlaps.length === 0) {
    return <Text style={styles.empty}>No shared details surfaced yet.</Text>;
  }
  return (
    <View style={styles.list}>
      {overlaps.map((o, i) => {
        const Glyph = TRAIT_GLYPH[o.kind];
        return (
          <View key={`${o.kind}-${i}`} style={styles.item}>
            <View style={styles.icon}><Glyph size={20} color={color.ink} accent={color.brand} /></View>
            <Text style={styles.label}>{o.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.hairline,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  icon: { marginRight: space.md },
  label: { ...font.body, color: color.ink, flex: 1, fontWeight: '600' },
  empty: { ...font.caption },
});
