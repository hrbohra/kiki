import type { ComponentType } from 'react';
import type { GlyphProps } from './_shared';
import { Transit } from './Transit';
import { Quiet } from './Quiet';
import { Garden } from './Garden';
import { Desk } from './Desk';
import { Pet } from './Pet';
import { Room } from './Room';

/** Maps a listing amenity/vibe tag to its Loop glyph, where one exists.
 *  Tags without a glyph (Ensuite, Balcony, Central, Female-only, Long stays) render text-only. */
export const AMENITY_GLYPH: Record<string, ComponentType<GlyphProps>> = {
  'Near tube': Transit,
  'Quiet': Quiet,
  'Garden': Garden,
  'WFH desk': Desk,
  'Pet-friendly': Pet,
  'Whole place': Room,
  'Room': Room,
};
