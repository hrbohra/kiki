import Svg, { G, Path, Circle } from 'react-native-svg';
import { MARK, ACCENT, type GlyphProps } from './_shared';

/** vouch — the mark (80%) with a tick badge bottom-right. Retires ✅ / bare "✓". */
export function Vouch({ size = 24, color = '#1A1A1A', accent = ACCENT.trust, surface = '#F5F5F4' }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G transform="translate(-8.405 -3.814) scale(0.3794)">
        <Path d={MARK} fill={color} />
      </G>
      <Circle cx={18.1} cy={18.1} r={5.4} fill={surface} />
      <Circle cx={18.1} cy={18.1} r={4.2} fill={accent} />
      <Path d="M16.1 18.2 L17.5 19.6 L20.2 16.5" fill="none" stroke={surface} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
