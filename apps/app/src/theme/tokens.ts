// Design tokens. Baseline reverse-engineered from Kiki's product screenshots, then refined
// per the design handoff (Kiki_Design_Handoff_Brief → returned spec). Light mode only.

export const color = {
  brand: '#17A589', // primary: buttons, active tab, sent bubbles (a FILL colour, not text)
  brandDark: '#0F8D74', // pressed-CTA fill only. NOT for text — 3.66:1 on mint fails AA; use textOnMint.
  brandTint: '#E7F4F0', // fill behind trust elements + guest-book quote card
  // Teal TEXT colours (AA on both white and mint). The Trust-tab handoff measured that the old
  // brandDark #0F8D74 fails as text (3.66:1 on mint); these pass.
  textOnMint: '#0E4E42', // 9.6:1 on mint / on white — all teal body text
  textOnMintSoft: '#2C6559', // 5.98:1 — secondary teal text
  tealDeep: '#0B4139', // reserved deepest teal
  bg: '#F7F7F5',
  surface: '#FFFFFF',
  ink: '#1A1A1A',
  inkSoft: '#4B5563', // 7.0:1 on white
  inkFaint: '#626C75', // corrected from #8A9099 (3.21:1, failed AA) → 4.84:1
  hairline: '#ECECE8', // card borders + dividers
  hairlineSoft: '#F0F0EC', // row dividers inside a card
  hairlineTint: '#CFE4DE', // hairline on a mint surface
  dashedTint: '#9FC9BF', // dashed border on a mint surface
  // Degree ramp: 1st / 2nd / 3rd+. Pin dots, graph edges, meter fills.
  trust1: '#17A589',
  trust2: '#4FBFA6',
  trust3: '#9BCFC3',
  tieEmpty: '#CBDED8', // unfilled tie-meter bar
  peripheralNode: '#B7CFC8', // peripheral graph nodes / edges
  outerRing: '#DCE5E1', // outer dashed ring
  brokenLoop: '#B7C2C0', // broken loop mark (cold state)
  caveat: '#C15B5B', // the single caveat mark (a 3px left strip)
  gold: '#C9A227', // gold-sweep border (non-teal tappable pills)
  goldSheen: '#D8B15C',
  mapLand: '#EAEEE9',
  mapWater: '#D6E3E8',
  mapRoad: '#FFFFFF',
  screen: '#F5F5F4', // trust-tab screen background
  heart: '#E5567A',
  overlayDark: 'rgba(31,41,43,0.55)',
} as const;

/** Community tier colours: Newcomer · Trusted · Pillar · Legend. */
export const tierColor = {
  Newcomer: '#8A9099',
  Trusted: '#17A589',
  Pillar: '#3B7DD8',
  Legend: '#C98A2B',
} as const;

/** Per-review sentiment chip colours. Negative is a muted brick, never alarm red. */
export const sentimentColor = {
  positive: '#0F8D74',
  mixed: '#8A9099',
  negative: '#C15B5B',
} as const;

/** Degree (1/2/3+) → trust ramp colour; unreachable → faint. */
export function trustColor(degrees: number): string {
  if (!Number.isFinite(degrees)) return color.inkFaint;
  if (degrees <= 1) return color.trust1;
  if (degrees === 2) return color.trust2;
  return color.trust3;
}

export const radius = {
  sm: 10, // inner blocks
  md: 14,
  lg: 18,
  xl: 22, // default card radius
  hero: 24, // profile hero card only
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screen: 14, // screen side inset
  card: 16, // card padding
} as const;

export const shadow = {
  card: { shadowColor: '#1A1A1A', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  raised: { shadowColor: '#1A1A1A', shadowOpacity: 0.12, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  brand: { shadowColor: 'rgba(23,165,137,0.28)', shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
} as const;

/** Back-compat alias (older components import cardShadow). */
export const cardShadow = shadow.card;

export const font = {
  display: { fontSize: 29, fontWeight: '700' as const, color: color.ink, letterSpacing: -0.7 },
  h1: { fontSize: 27, fontWeight: '700' as const, color: color.ink, letterSpacing: -0.6 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: color.ink, letterSpacing: -0.5 },
  h3: { fontSize: 17, fontWeight: '700' as const, color: color.ink },
  title: { fontSize: 18, fontWeight: '700' as const, color: color.ink, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '500' as const, color: color.inkSoft, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '600' as const, color: color.inkFaint },
  micro: { fontSize: 11, fontWeight: '700' as const, color: color.inkSoft },
  button: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
} as const;

// --- gradients (expo-linear-gradient) ---------------------------------------
// Every avatar/photo is a two-stop gradient of its own hue: a light source, not a flat block.

/** Mix a hex colour toward white by `amount` (0..1). */
export function lighten(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const h = (c: number) => mix(c).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Avatar disc gradient (~145°): lighten 38% → hue. */
export function avatarGradient(hex: string): [string, string] {
  return [lighten(hex, 0.38), hex];
}

/** Listing image placeholder gradient (~150°): lighten 30% → hue. */
export function photoGradient(hex: string): [string, string] {
  return [lighten(hex, 0.3), hex];
}

/** Diagonal start/end approximating the ~145–150° gradients above. */
export const gradientStart = { x: 0, y: 0 };
export const gradientEnd = { x: 1, y: 1 };

