import Svg, { G, Path } from 'react-native-svg';
import { MARK, ACCENT, type GlyphProps } from './_shared';

/** invite — the mark (76%, pushed right) with a teal arrow entering from the left. */
export function Invite({ size = 24, color = '#1A1A1A', accent = ACCENT.trust }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G transform="translate(-2.485 -0.723) scale(0.3605)">
        <Path d={MARK} fill={color} />
      </G>
      <Path d="M1.3 12 H5.6" stroke={accent} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M3.5 9.7 L6 12 L3.5 14.3" fill="none" stroke={accent} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
