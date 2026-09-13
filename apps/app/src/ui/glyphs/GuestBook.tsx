import Svg, { Path } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** guest book — an open book. Entries you owe and entries about you. Retires 📖. */
export function GuestBook({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 7.4 C10.4 6.1 8 5.7 5.6 5.9 v12.2 c2.4 -0.2 4.8 0.2 6.4 1.5" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M12 7.4 C13.6 6.1 16 5.7 18.4 5.9 v12.2 c-2.4 -0.2 -4.8 0.2 -6.4 1.5" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    </Svg>
  );
}
