import Svg, { Path, Circle } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** hometown — where you moved from. Sits beside the flag, never instead of it. */
export function Hometown({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.4} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M4.2 13.6 C6.9 11.2 9.3 11.2 12 12.8 C14.7 14.4 17.1 14.4 19.8 12" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}
