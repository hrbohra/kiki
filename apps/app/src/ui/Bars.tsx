import { View, Text, StyleSheet } from 'react-native';
import { color, radius, sentimentColor } from '../theme/tokens';

/** Horizontal sentiment meter: −1..1 mapped to a coloured fill with a verdict word. */
export function SentimentMeter({ score }: { score: number }) {
  const pct = Math.round(((score + 1) / 2) * 100);
  const positive = score > 0.15;
  const negative = score < -0.15;
  const fill = positive ? color.brand : negative ? sentimentColor.negative : color.inkFaint;
  const verdict = positive ? 'Positive' : negative ? 'Negative' : 'Mixed';
  const verdictColor = positive ? color.textOnMint : negative ? sentimentColor.negative : color.inkFaint;
  return (
    <View style={styles.meterWrap}>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${pct}%`, backgroundColor: fill }]} />
      </View>
      <Text style={[styles.verdict, { color: verdictColor }]}>{verdict}</Text>
    </View>
  );
}

// Warmth and safety are the two a nervous host actually scans for, so they read as brand;
// the rest are a quieter teal, so the dashboard ranks rather than lists.
const STRONG_THEMES = new Set(['warmth', 'safety']);

/** Labelled theme-frequency bar: label + "N of max" above, the bar below. */
export function ThemeBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  const fill = STRONG_THEMES.has(label.toLowerCase()) ? color.brand : '#8FC7B8';
  return (
    <View style={styles.themeRow}>
      <View style={styles.themeLabelRow}>
        <Text style={styles.themeLabel}>{label}</Text>
        <Text style={styles.themeCount}>{value} of {max}</Text>
      </View>
      <View style={styles.themeTrack}>
        <View style={[styles.themeFill, { width: `${Math.max(6, pct)}%`, backgroundColor: fill }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meterWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meterTrack: { flex: 1, height: 9, borderRadius: radius.pill, backgroundColor: color.hairlineSoft, overflow: 'hidden' },
  meterFill: { height: 9, borderRadius: radius.pill },
  verdict: { fontSize: 12, fontWeight: '700', width: 66, textAlign: 'right' },
  themeRow: { gap: 6 },
  themeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeLabel: { fontSize: 13, fontWeight: '700', color: color.inkSoft, textTransform: 'capitalize' },
  themeCount: { fontSize: 13, fontWeight: '700', color: color.inkFaint },
  themeTrack: { height: 8, borderRadius: radius.pill, backgroundColor: color.hairlineSoft, overflow: 'hidden' },
  themeFill: { height: 8, borderRadius: radius.pill },
});
