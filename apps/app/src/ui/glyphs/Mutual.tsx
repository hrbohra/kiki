import Svg, { G, Path, Circle } from 'react-native-svg';
import { MARK, ACCENT, type GlyphProps } from './_shared';

/** mutual — the mark (80%) with a ring badge bottom-right. Use on "a mutual" chips. */
export function Mutual({ size = 24, color = '#1A1A1A', accent = ACCENT.trust, surface = '#F5F5F4' }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G transform="translate(-8.405 -3.814) scale(0.3794)">
        <Path d={MARK} fill={color} />
      </G>
      <Circle cx={18.1} cy={18.1} r={5.4} fill={surface} />
      <Circle cx={18.1} cy={18.1} r={4.2} fill="none" stroke={accent} strokeWidth={1.7} />
      <Circle cx={18.1} cy={18.1} r={1.7} fill={accent} />
    </Svg>
  );
}
