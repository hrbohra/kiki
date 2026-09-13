// Loop glyph set — 22 marks. See design_handoff_kiki_glyphs_map for the source of truth.
// Four mark glyphs (Loop/Vouch/Mutual/Invite) carry the real logo path; the rest are monoline.
// Props: { size = 24, color = '#1A1A1A', accent, surface }. Never render below 16px.
export type { GlyphProps } from './_shared';
export { ACCENT } from './_shared';
export { TRAIT_GLYPH } from './traitGlyph';
export { AMENITY_GLYPH } from './amenityGlyph';

// Trust
export { Loop } from './Loop';
export { Vouch } from './Vouch';
export { Mutual } from './Mutual';
export { Invite } from './Invite';
export { Degrees } from './Degrees';
export { GuestBook } from './GuestBook';
export { Compose } from './Compose';
export { SharedOrigin } from './SharedOrigin';

// Standing
export { Standing } from './Standing';

// Life facts
export { Hometown } from './Hometown';
export { Studied } from './Studied';
export { Work } from './Work';
export { Climb } from './Climb';
export { Pet } from './Pet';

// Home
export { Room } from './Room';
export { Keys } from './Keys';
export { Garden } from './Garden';
export { Transit } from './Transit';
export { Quiet } from './Quiet';
export { Desk } from './Desk';
export { Dates } from './Dates';

// Cost
export { Request } from './Request';
