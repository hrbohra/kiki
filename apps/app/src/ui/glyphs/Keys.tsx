import Svg, { Path, Circle } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** keys — handover, a confirmed stay. Retires 🔑. */
export function Keys({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={8.6} cy={9.4} r={3.9} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M11.2 12.1 L18.8 19.7" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M15.4 16.3 L17.6 14.1" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}
