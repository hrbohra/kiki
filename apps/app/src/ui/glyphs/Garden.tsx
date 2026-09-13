import Svg, { Path } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** garden — a leaf on a stem. Amenity chip. Retires 🌿. */
export function Garden({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 19.4 V11.6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M12 11.6 C12 7.2 15.3 4.6 19.4 4.6 C19.4 9 16.1 11.6 12 11.6 z" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M11.4 14.6 C9.6 13 7.2 12.6 4.6 13 C5.2 15.8 7.8 17.2 10.6 16.8" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    </Svg>
  );
}
