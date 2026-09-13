import { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color } from '../../theme/tokens';

interface Props {
  open: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  leading?: ReactNode; // e.g. the "i" info glyph
  chevron?: 'plusminus' | 'arrow';
  children: ReactNode; // revealed body
  topBorder?: boolean;
}

/**
 * A real disclosure button (not a tappable View): announces expanded state and keeps a 44pt
 * target. Independent of every other disclosure on the screen. Body simply mounts/unmounts —
 * instant, which also satisfies reduced-motion for free.
 */
export function Disclosure({ open, onToggle, title, subtitle, leading, chevron = 'plusminus', children, topBorder }: Props) {
  const glyph = chevron === 'arrow' ? '›' : open ? '–' : '+';
  return (
    <View style={topBorder && styles.topBorder}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.header}
      >
        {leading}
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={[styles.chevron, chevron === 'arrow' && { transform: [{ rotate: open ? '90deg' : '0deg' }] }]}>{glyph}</Text>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBorder: { borderTopWidth: 1, borderTopColor: color.hairlineSoft },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingVertical: 11 },
  titles: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: color.ink },
  subtitle: { fontSize: 12, color: color.inkFaint },
  chevron: { fontSize: 15, fontWeight: '700', color: color.inkFaint, width: 18, textAlign: 'center' },
  body: { paddingBottom: 12, gap: 10 },
});
