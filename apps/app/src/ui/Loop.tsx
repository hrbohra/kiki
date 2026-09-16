import Svg, { Path } from 'react-native-svg';
import { color as tokens } from '../theme/tokens';
import { MARK } from './glyphs/_shared';

interface Props {
  size?: number; // rendered square: `size` is both width and height
  color?: string;
  opacity?: number;
  /** Kept for call-site compatibility; the mark is a filled outline and is never stroked. */
  strokeWidth?: number;
}

/**
 * The Kiki mark — the real logo path, verbatim from kiki-logo.svg (glyphs/_shared MARK).
 * This replaced the earlier two-ring stand-in everywhere it was used (wordmarks, the profile hero
 * watermark, trust badges, the entry screen): the Sep 6 glyph handoff fixed the logo, and the app
 * now carries it in one place. A filled outline: never stroke it, never re-trace it.
 */
export function Loop({ size = 100, color = tokens.brand, opacity = 0.1 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="21 9 53 53" opacity={opacity}>
      <Path d={MARK} fill={color} />
    </Svg>
  );
}
