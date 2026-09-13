import Svg, { Path, Circle } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** degrees — one, two, three steps; the third dashed = unverified. Reach pills.
 *  The dashed muted-teal third node matches the map's ring encoding. */
export function Degrees({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={5} cy={12} r={2.3} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={12} cy={12} r={2.3} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={19} cy={12} r={2.3} fill="none" stroke="#9BCFC3" strokeWidth={sw} strokeDasharray="1.9 1.7" />
      <Path d="M7.4 12 H9.6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M14.4 12 H16.6" stroke="#9BCFC3" strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}
