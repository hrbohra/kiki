// Pure domain types for the Kiki "how you're connected" prototype.
// No React / React Native imports live in this folder: the domain is testable in isolation.

/** A member of the Kiki trust network. */
export interface Member {
  id: string;
  name: string;
  /** ISO country of origin, drives the flag in the UI (e.g. "NZ", "AU", "GB"). */
  country: string;
  avatarColor: string; // deterministic placeholder tint; real app uses a photo URL
  avatarUrl?: string; // real photo once uploaded (Phase 5); falls back to the tint
  /** Free-form facts we can find overlaps against (city moved from, uni, gyms, interests). */
  traits: Trait[];
}

export type TraitKind =
  | 'origin' // where they grew up / moved from
  | 'education' // university + year
  | 'interest' // gym, sport, hobby
  | 'work' // company / field
  | 'event'; // a Kiki event both attended (co-attendance ⇒ inferred provenance)

/**
 * How a fact was established. The Trust tab shows this per overlap because an unsourced
 * inference reads as surveillance; a sourced one reads as helpful.
 */
export type Provenance =
  | 'matched' // exact field match (both typed the same origin)
  | 'inferred' // derived, e.g. co-attendance at an event
  | 'self_declared'; // typed by the user, unverified

export interface Trait {
  kind: TraitKind;
  /** Canonical key used for overlap matching, e.g. "uni:auckland:2017". Lowercased, stable. */
  key: string;
  /** Human label shown in the UI, e.g. "University of Auckland, 2017". */
  label: string;
  /** How we know it. Defaults to self_declared (a typed profile fact). */
  provenance?: Provenance;
}

/**
 * A vouch is a directed trust edge: `from` personally vouches for `to`.
 * The connection graph is the set of all vouches; a path through it is a chain of trust.
 */
export interface Vouch {
  from: string; // Member id
  to: string; // Member id
  /** Optional context the voucher wrote. */
  note?: string;
  /** Who the note is actually about (may not be `to`). Turns a misleading quote into an honest one. */
  noteSubject?: string; // Member id
  /** Whether the voucher agreed to be shown on the guest's Trust tab. Must be true to render them. */
  consentToDisplay?: boolean;
  /** Tie-strength inputs — measured, never a guessed closeness score. */
  stays?: number; // times `from` has stayed with the viewer
  sharedEvents?: number; // Kiki events attended together
}

/** A listing a member is offering while away. */
export interface Listing {
  id: string;
  hostId: string;
  title: string;
  area: string; // "Finsbury Park, London"
  pricePerNight: number; // GBP per night, the unit Kiki’s own app prices in
  kind: 'Room' | 'Whole place';
  lat: number;
  lng: number;
  photoColor: string; // placeholder tint for the demo (no bundled photos)
  photoUrl?: string; // real photo once uploaded (Phase 5); falls back to the tint
  tags: string[]; // filterable amenities/vibe: "Quiet", "Pet-friendly", "Near tube", ...
}

/** A guest-book entry: what a guest wrote about a stay. Free text, fed to the NLP pipeline. */
export interface Review {
  id: string;
  hostId: string;
  authorId: string;
  listingId: string;
  text: string;
  day: number; // integer day index (higher = more recent)
}

/**
 * A review written *about a guest* by a host who hosted them — the mirror of `Review`.
 * The Trust tab's cold state leans on these: a newcomer with no mutuals still has a track
 * record from the people whose homes they've stayed in.
 */
export interface GuestReview {
  id: string;
  subjectId: string; // the guest being written about
  authorId: string; // the host who hosted them
  text: string;
  day: number;
}

export type ContributionKind =
  | 'hosted' // hosted a Kikier
  | 'vouched' // vouched for someone
  | 'referred' // brought a new member in
  | 'reviewed' // wrote a guest-book entry
  | 'attended' // showed up to a community event
  | 'stayed'; // completed a stay as a guest

/** One thing a member did for the community, used to compute their tier/standing. */
export interface Contribution {
  memberId: string;
  kind: ContributionKind;
  day: number; // integer day index (higher = more recent)
}

/** An overlap the "AI mutual friend" surfaces between the viewer and a host. */
export interface Overlap {
  kind: TraitKind;
  label: string; // "You both moved to London from New Zealand"
  provenance: Provenance; // how we know it — mandatory, so an unsourced inference can't render
}

/** Strength of the viewer's tie to one of their direct connections (a vouching mutual). */
export interface TieInfo {
  strength: 1 | 2 | 3; // measured from stays + shared events, never guessed
  reason: string; // "Has stayed with you twice."
}

/** One consenting mutual who vouches for the host — a channel of trust between you and them. */
export interface VouchChannel {
  voucher: Member;
  note?: string;
  noteSubject?: string; // display name the note is actually about, if not the host
  tie: TieInfo; // how well YOU know the voucher
}

/** One review of the host written by a past host of theirs (cold-state track record). */
export interface GuestTrackEntry {
  author: Member;
  known: boolean; // is the author within the viewer's circle?
  text: string;
  day: number;
}

/** Everything the Trust tab renders, derived from one graph + guest-book roll-up. */
export interface TrustStory {
  host: Member;
  reachable: boolean;
  degrees: number; // shortest degrees of separation; Infinity if unreachable
  warm: boolean; // ≥1 consenting mutual within reach vs a cold newcomer
  direct: boolean; // degree 1 — you know them yourself, no mutual needed
  directLink?: { note?: string; tie: TieInfo }; // your own tie to them, when direct
  channels: VouchChannel[]; // consenting vouching mutuals (the warm case)
  routes: Member[][]; // all shortest routes viewer → host (for the ring graph)
  overlaps: Overlap[]; // shared facts, each with provenance
  consentNames: string[]; // names of members shown with consent
  inviter?: { member: Member; degrees: number }; // cold: the far member who let them in
  guestTrackRecord: GuestTrackEntry[]; // cold: reviews about the host as a guest
}

/** The fully resolved trust story shown on the connection screen. */
export interface ConnectionStory {
  /** Ordered members from viewer -> ... -> host. length 1 means viewer IS the host. */
  path: Member[];
  /** Notes attached to each hop (path[i] -> path[i+1]); notes[i] may be undefined. */
  hopNotes: (string | undefined)[];
  /** Degrees of separation: path.length - 1. Infinity if unreachable. */
  degrees: number;
  overlaps: Overlap[];
  reachable: boolean;
}
