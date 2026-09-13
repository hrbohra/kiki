import Svg, { Path, Circle } from 'react-native-svg';
import { strokeFor, ACCENT, type GlyphProps } from './_shared';

/** transit — a circle with a bar through it. "Near tube", abstracted. Deliberately
 *  NOT the TfL roundel, which is trademarked — do not "improve" it toward one. */
export function Transit({ size = 24, color = '#1A1A1A', accent = ACCENT.trust }: GlyphProps) {
  const sw = strokeFor(size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={7.4} fill="none" stroke={color} strokeWidth={sw} />
      <Path d="M4.2 12 H19.8" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}
