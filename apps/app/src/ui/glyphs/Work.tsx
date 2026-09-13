import Svg, { Path, Rect } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** work — a briefcase. What you do. Retires 💻 and the job-title bullet. */
export function Work({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3.6} y={8.4} width={16.8} height={9.8} rx={2} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M9 8.4 V6.9 A1.6 1.6 0 0 1 10.6 5.3 h2.8 A1.6 1.6 0 0 1 15 6.9 V8.4" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    </Svg>
  );
}
