import Svg, { Path, Rect } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** desk — a monitor on a table. "WFH desk". Retires 🖥. */
export function Desk({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3.6 16.4 h16.8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M6.2 16.4 V19.4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M17.8 16.4 V19.4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Rect x={7.6} y={6.2} width={8.8} height={6.4} rx={1.4} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M12 12.6 V16.4" stroke={color} strokeWidth={sw} />
    </Svg>
  );
}
