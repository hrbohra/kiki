import Svg, { Path, Circle } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** climb — a bouldering route. Bouldering at Blok. Retires 🧗. */
export function Climb({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={6} cy={17} r={1.8} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={12} cy={12.4} r={1.8} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={18} cy={7} r={1.8} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M7.5 15.8 L10.5 13.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M13.4 11.2 L16.6 8.2" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}
