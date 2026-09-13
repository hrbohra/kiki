import Svg, { Circle } from 'react-native-svg';
import { strokeFor, ACCENT, type GlyphProps } from './_shared';

/** compose — the intro being written: three dots, the third faded, so it reads as
 *  thinking, not magic. Retires ✨ (the generated-filler tell). */
export function Compose({ size = 24, color = '#1A1A1A', accent = ACCENT.trust }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={7.6} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={8.7} cy={12} r={1.05} fill={accent} />
      <Circle cx={12} cy={12} r={1.05} fill={accent} />
      <Circle cx={15.3} cy={12} r={1.05} fill={accent} opacity={0.4} />
    </Svg>
  );
}
