import Svg, { Path, Circle } from 'react-native-svg';
import { strokeFor, ACCENT, type GlyphProps } from './_shared';

/** standing — contribution, in gold. Me tab, tier pill. Retires 🏆. */
export function Standing({ size = 24, color = '#1A1A1A', accent = ACCENT.standing }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.4} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M8.8 14.8 V12.6" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M12 14.8 V10.4" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M15.2 14.8 V8.4" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}
