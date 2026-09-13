import type { ComponentType } from 'react';
import type { TraitKind } from '../../domain/types';
import type { GlyphProps } from './_shared';
import { SharedOrigin } from './SharedOrigin';
import { Studied } from './Studied';
import { Climb } from './Climb';
import { Work } from './Work';
import { Dates } from './Dates';

/** Maps an overlap/trait kind to its Loop glyph. Used by the spotlight pill and
 *  any trait row that wants a mark instead of the retired emoji. */
export const TRAIT_GLYPH: Record<TraitKind, ComponentType<GlyphProps>> = {
  origin: SharedOrigin,
  education: Studied,
  interest: Climb,
  work: Work,
  event: Dates,
};
