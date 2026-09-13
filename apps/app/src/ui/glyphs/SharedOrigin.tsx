import Svg, { Path, Circle } from 'react-native-svg';
import { strokeFor, ACCENT, type GlyphProps } from './_shared';

/** sharedOrigin — two people, one horizon. Retires 🌏 on "Both from…". */
export function SharedOrigin({ size = 24, color = '#1A1A1A', accent = ACCENT.trust }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={8.6} cy={10} r={4.6} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={15.4} cy={10} r={4.6} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M4.4 19.2 C7 16.8 17 16.8 19.6 19.2" fill="none" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}
