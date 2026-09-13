import Svg, { Path } from 'react-native-svg';
import { strokeFor, ACCENT, type GlyphProps } from './_shared';

/** request — someone asking. The rust seam marks the ask, not a warning. */
export function Request({ size = 24, color = '#1A1A1A', accent = ACCENT.cost }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 12.8 l2.4 -6.4 A2 2 0 0 1 8.3 5.1 h7.4 a2 2 0 0 1 1.9 1.3 L20 12.8 v4.4 a2 2 0 0 1 -2 2 H6 a2 2 0 0 1 -2 -2 z" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M4 12.8 h4 l1.6 2.6 h4.8 L16 12.8 h4" fill="none" stroke={accent} strokeWidth={sw} strokeLinejoin="round" />
    </Svg>
  );
}
