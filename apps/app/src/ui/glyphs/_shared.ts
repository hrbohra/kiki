/** Shared types + constants for the Loop glyph set.
 *  Underscore prefix keeps this out of the glyph barrel. */

export interface GlyphProps {
  size?: number;
  /** Main stroke / fill colour. */
  color?: string;
  /** Accent colour for the one meaningful accent element in the glyph. */
  accent?: string;
  /** Surface the glyph sits on — fills the badge disc on the mark glyphs.
   *  A wrong value shows up as a visible coloured ring. Paper #F5F5F4,
   *  chips #FFFFFF, dark chrome #0F1B17. */
  surface?: string;
}

/** Fixed accent palette (README): teal trust · gold standing · rust cost. */
export const ACCENT = { trust: '#17A589', standing: '#C9A227', cost: '#C15B5B' } as const;

/** 1.9px normally; 2.2px at chip scale (<=16px), where 1.9 optically vanishes. */
export const strokeFor = (size: number) => (size <= 16 ? 2.2 : 1.9);

/** The real Kiki logo mark, lifted verbatim from kiki-logo.svg: the tile subpath
 *  (M9 34v27h71V7H9z) stripped and the relative start (m37-16) re-anchored to the
 *  absolute M46 18. It is a filled outline — NEVER stroke it, never re-trace it. */
export const MARK =
  'M46 18c0 1-2 2-7.5 3.6-8.1 2.5-7 18.3 1.7 24.6 4.2 2.9 10.6 3.1 14.3.3 3.4-2.5 3.3-3.8-.4-4.8-3.8-.9-4.8-2.5-2.8-4.4 1.2-1.2 2.2-1.3 4.8-.5 1.9.6 5.3 1.6 7.7 2.2 3.2.8 4.2 1.5 4.2 3.2 0 1.8-.5 2-4.2 1.6-2.4-.3-3.5-.3-2.5-.1 2.6.6 2.1 1.8-2 5.3-8 6.5-15.1 6.3-23.3-.7-2.9-2.5-5.2-3.7-6.7-3.5-1.9.3-2.3-.1-2.3-2.2 0-3 .7-3.3 2.7-.9.9 1.2.8.7-.3-1.6-1.2-2.5-1.5-5.2-1.2-9.9.4-5.9.7-6.7 4.1-9.8 3.1-2.9 4.4-3.4 8.7-3.4 2.7 0 5 .5 5 1m16.1.7c3.6 2.1 5.9 6.9 5.9 12 0 6.5-.8 8.1-3.7 7.5-2.3-.4-2.5-.8-1.9-4.2 1.1-7-2.1-12-7.6-12-2.6 0-6.8 2.5-6.8 4.1 0 .5 1-.1 2.1-1.2 2-2 2.2-2 3.1-.5 1.4 2.6.1 8.1-2.7 11.5-1.4 1.6-4.6 3.9-7.2 5.1l-4.7 2.2-1.9-2.3-1.9-2.3 4.9-1.3c4.9-1.2 8.3-4.2 8.3-7.2 0-1.1-.4-.8-1.3.8-1.9 3.8-3.5 3.6-4.2-.3-1-4.9.6-8.7 4.5-11.4 4-2.7 10.9-2.9 15.1-.5';
