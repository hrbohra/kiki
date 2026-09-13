import Svg, { Path } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** room — a house. Listing type badge. Retires 🏠. */
export function Room({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4.4 11.2 L12 5 L19.6 11.2" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.5 11.4 V19.2 h11 V11.4" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    </Svg>
  );
}
