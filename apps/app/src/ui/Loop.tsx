import Svg, { Circle } from 'react-native-svg';
import { color as tokens } from '../theme/tokens';

interface Props {
  size?: number; // width; height follows the 100×60 aspect
  color?: string;
  opacity?: number;
  strokeWidth?: number;
}

/**
 * The signature motif: two overlapping rings — the pretzel/knot reduced to its simplest
 * legible form. It means "two people, one overlap", which is the whole product. Used only
 * as faint texture (never > ~18% opacity) or as a small leading glyph on trust banners.
 */
export function Loop({ size = 100, color = tokens.brand, opacity = 0.1, strokeWidth = 6 }: Props) {
  const h = size * 0.6;
  return (
    <Svg width={size} height={h} viewBox="0 0 100 60" opacity={opacity}>
      <Circle cx={38} cy={30} r={21} stroke={color} strokeWidth={strokeWidth} fill="none" />
      <Circle cx={62} cy={30} r={21} stroke={color} strokeWidth={strokeWidth} fill="none" />
    </Svg>
  );
}
