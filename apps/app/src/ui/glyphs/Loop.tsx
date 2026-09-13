import Svg, { G, Path } from 'react-native-svg';
import { MARK, type GlyphProps } from './_shared';

/** loop — the brand mark at full size. Empty state, watermark, splash. */
export function Loop({ size = 24, color = '#1A1A1A' }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G transform="translate(-10.506 -4.767) scale(0.4743)">
        <Path d={MARK} fill={color} />
      </G>
    </Svg>
  );
}
