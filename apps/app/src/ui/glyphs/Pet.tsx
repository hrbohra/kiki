import Svg, { Path, Circle } from 'react-native-svg';
import { strokeFor, type GlyphProps } from './_shared';

/** pet — a paw. Pet-friendly, or a pet you'd sit. Retires 🐕. */
export function Pet({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={7.1} cy={9.4} r={2} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={12} cy={7.5} r={2} fill="none" stroke={color} strokeWidth={sw} />
      <Circle cx={16.9} cy={9.4} r={2} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M12 12.4 C15 12.4 17.2 14.2 17.2 16.2 C17.2 18 15.3 19 12 19 C8.7 19 6.8 18 6.8 16.2 C6.8 14.2 9 12.4 12 12.4 z" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    </Svg>
  );
}
