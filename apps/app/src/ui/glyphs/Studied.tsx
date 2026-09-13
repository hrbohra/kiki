import Svg, { Path } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** studied — a mortarboard. "Paris, 2017". Retires 🎓. */
export function Studied({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3.6 9.6 L12 6 L20.4 9.6 L12 13.2 z" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M7.6 11.4 V15.4 C7.6 16.9 9.5 18 12 18 C14.5 18 16.4 16.9 16.4 15.4 V11.4" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}
