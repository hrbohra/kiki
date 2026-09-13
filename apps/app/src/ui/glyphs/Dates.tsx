import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { strokeFor, ACCENT, type GlyphProps } from './_shared';

/** dates — a calendar. Trip window. Retires 🏄 on trip rows. */
export function Dates({ size = 24, color = '#1A1A1A', accent = ACCENT.trust }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4} y={5.6} width={16} height={14.4} rx={2.4} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M4 10 H20" stroke={color} strokeWidth={sw} />
      <Path d="M8.4 3.6 V6.6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M15.6 3.6 V6.6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={12} cy={15} r={1.5} fill={accent} />
    </Svg>
  );
}
