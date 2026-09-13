import Svg, { Path } from 'react-native-svg';
import { strokeFor, ACCENT, type GlyphProps } from './_shared';

/** quiet — a muted speaker. Amenity chip. Retires 🤫. */
export function Quiet({ size = 24, color = '#1A1A1A', accent = ACCENT.cost }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4.6 9.8 h3.2 L11.6 6.4 v11.2 L7.8 14.2 H4.6 z" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M15.2 9.6 L19.6 14" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M19.6 9.6 L15.2 14" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}
