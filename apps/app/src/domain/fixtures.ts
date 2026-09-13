import type { Contribution, GuestReview, Listing, Member, Review, Vouch } from './types';

// Synthetic data only. No real user information. One dataset drives every screen: map, graph,
// guest-book NLP, similarity, tiering, messaging — and the Trust tab (warm + cold states).

const teal = '#17A589';

/** Reference "today" as an integer day index; contributions/reviews carry earlier days. */
export const WORLD_NOW_DAY = 400;

export const VIEWER_ID = 'you';

export const members: Member[] = [
  {
    id: 'you', name: 'You', country: 'NZ', avatarColor: teal,
    traits: [
      { kind: 'origin', key: 'origin:nz:mount-eden', label: 'Mount Eden', provenance: 'self_declared' },
      { kind: 'education', key: 'uni:paris:2017', label: 'Paris, 2017', provenance: 'self_declared' },
      { kind: 'interest', key: 'gym:blok-shoreditch', label: 'bouldering at Blok Shoreditch', provenance: 'self_declared' },
      { kind: 'event', key: 'event:dalston-picnic-jun', label: 'the Dalston picnic in June', provenance: 'inferred' },
    ],
  },
  {
    id: 'emma', name: 'Maia', country: 'NZ', avatarColor: '#C98A6B',
    traits: [
      { kind: 'origin', key: 'origin:nz:mount-eden', label: 'Mount Eden', provenance: 'self_declared' },
      { kind: 'education', key: 'uni:paris:2017', label: 'Paris, 2017', provenance: 'self_declared' },
      { kind: 'interest', key: 'gym:blok-shoreditch', label: 'bouldering at Blok Shoreditch', provenance: 'self_declared' },
      { kind: 'event', key: 'event:dalston-picnic-jun', label: 'the Dalston picnic in June', provenance: 'inferred' },
    ],
  },
  {
    id: 'bella', name: 'Nina', country: 'GB', avatarColor: '#5B7DB1',
    traits: [{ kind: 'origin', key: 'origin:gb:london', label: 'London', provenance: 'self_declared' }],
  },
  {
    id: 'sophie', name: 'Sophie', country: 'AU', avatarColor: '#B15B93',
    traits: [{ kind: 'interest', key: 'gym:blok-shoreditch', label: 'bouldering at Blok Shoreditch', provenance: 'self_declared' }],
  },
  {
    id: 'amy', name: 'Amy', country: 'AU', avatarColor: '#C15B5B',
    traits: [{ kind: 'origin', key: 'origin:au:sydney', label: 'Sydney', provenance: 'self_declared' }],
  },
  {
    id: 'katelin', name: 'Katelin', country: 'AU', avatarColor: '#7BAE8E',
    traits: [
      { kind: 'origin', key: 'origin:au:bondi', label: 'Bondi', provenance: 'self_declared' },
      { kind: 'education', key: 'uni:paris:2017', label: 'Paris, 2017', provenance: 'self_declared' },
    ],
  },
  { id: 'ollie', name: 'Ollie', country: 'NZ', avatarColor: '#4E7C8A', traits: [] },
  {
    id: 'danica', name: 'Danica', country: 'AU', avatarColor: '#A6863F',
    traits: [{ kind: 'interest', key: 'gym:blok-shoreditch', label: 'bouldering at Blok Shoreditch', provenance: 'self_declared' }],
  },
  {
    id: 'nate', name: 'Nate', country: 'NZ', avatarColor: '#5E8C61',
    traits: [
      { kind: 'origin', key: 'origin:nz:mount-eden', label: 'Mount Eden', provenance: 'self_declared' },
      { kind: 'work', key: 'work:design', label: 'design', provenance: 'self_declared' },
    ],
  },
  {
    // Cold-state host: nothing in common with the viewer, reached only through a far invite.
    id: 'priya', name: 'Priya', country: 'GB', avatarColor: '#9B6BB1',
    traits: [
      { kind: 'origin', key: 'origin:gb:manchester', label: 'Manchester', provenance: 'self_declared' },
      { kind: 'work', key: 'work:nursing', label: 'nursing', provenance: 'self_declared' },
    ],
  },
  {
    id: 'theo', name: 'Theo', country: 'GB', avatarColor: '#B1885B',
    traits: [{ kind: 'interest', key: 'gym:blok-shoreditch', label: 'bouldering at Blok Shoreditch', provenance: 'self_declared' }],
  },
  {
    id: 'lena', name: 'Lena', country: 'AU', avatarColor: '#5BA0B1',
    traits: [{ kind: 'origin', key: 'origin:au:bondi', label: 'Bondi', provenance: 'self_declared' }],
  },
  // Peripheral members: hosts who reviewed Priya as a guest. Unconnected to the viewer on
  // purpose — in the cold state they read as "someone you don't know".
  { id: 'daniel', name: 'Daniel', country: 'GB', avatarColor: '#6B8CB1', traits: [] },
  { id: 'maya', name: 'Maya', country: 'GB', avatarColor: '#B16B9B', traits: [] },
];

// Undirected reachability; direction + note describe who vouched and why. Tie fields (stays,
// sharedEvents) measure how well the VIEWER knows their direct connections — never a guess.
export const vouches: Vouch[] = [
  { from: 'you', to: 'bella', stays: 2, sharedEvents: 1 }, // Nina has stayed with you twice
  { from: 'bella', to: 'emma', note: 'She put Iris up for a week and left the place spotless.', noteSubject: 'Iris', consentToDisplay: true },
  { from: 'you', to: 'sophie', stays: 0, sharedEvents: 1 }, // one Kiki picnic together
  { from: 'sophie', to: 'emma', consentToDisplay: true },
  { from: 'you', to: 'amy' },
  { from: 'amy', to: 'katelin', note: 'Amy stayed with Katelin last summer' },
  { from: 'katelin', to: 'ollie' },
  { from: 'katelin', to: 'priya', note: 'Katelin brought Priya into Kiki', consentToDisplay: true },
  { from: 'you', to: 'danica', note: 'You matched with Danica in April' },
  { from: 'sophie', to: 'theo' },
  { from: 'theo', to: 'lena' },
  { from: 'bella', to: 'nate' },
  { from: 'amy', to: 'lena' },
];

const TAGS = ['Near tube', 'Quiet', 'Pet-friendly', 'Ensuite', 'Balcony', 'Central', 'Garden', 'WFH desk', 'Female-only', 'Long stays'];

export const listings: Listing[] = [
  { id: 'l-emma', hostId: 'emma', title: 'Maia’s Room', area: 'De Beauvoir, London', pricePerNight: 44, kind: 'Room', lat: 51.5385, lng: -0.0785, photoColor: '#CBD5CE', tags: ['Near tube', 'Quiet', 'WFH desk', 'Female-only'] },
  { id: 'l-katelin', hostId: 'katelin', title: 'Katelin’s Room', area: 'Finsbury Park, London', pricePerNight: 38, kind: 'Room', lat: 51.5646, lng: -0.1066, photoColor: '#D6CFC4', tags: ['Near tube', 'Balcony', 'Long stays'] },
  { id: 'l-danica', hostId: 'danica', title: 'Danica’s Room', area: 'Tooting, London', pricePerNight: 41, kind: 'Room', lat: 51.4271, lng: -0.168, photoColor: '#CFC9D6', tags: ['Quiet', 'Garden', 'Pet-friendly'] },
  { id: 'l-ollie', hostId: 'ollie', title: 'Ollie’s Studio', area: 'Peckham, London', pricePerNight: 52, kind: 'Whole place', lat: 51.4739, lng: -0.0693, photoColor: '#C4D0D6', tags: ['Central', 'Ensuite', 'WFH desk'] },
  { id: 'l-nate', hostId: 'nate', title: 'Nate’s Flat', area: 'Hackney, London', pricePerNight: 49, kind: 'Whole place', lat: 51.5450, lng: -0.0553, photoColor: '#CED6C4', tags: ['Balcony', 'WFH desk', 'Long stays'] },
  { id: 'l-priya', hostId: 'priya', title: 'Priya’s Room', area: 'Bermondsey, London', pricePerNight: 46, kind: 'Room', lat: 51.4979, lng: -0.0637, photoColor: '#D6C4CE', tags: ['Near tube', 'Central', 'Female-only'] },
];

export const availableTags = TAGS;

// Guest-book entries (reviews written ABOUT a host). Varied tone so the NLP dashboard is
// interesting. Fed verbatim to src/pipeline/nlp.ts.
export const reviews: Review[] = [
  { id: 'r1', hostId: 'emma', authorId: 'bella', listingId: 'l-emma', day: 360, text: 'Maia was absolutely lovely and welcoming. The room was spotless and I felt so safe the whole stay. Would host her again in a heartbeat.' },
  { id: 'r2', hostId: 'emma', authorId: 'sophie', listingId: 'l-emma', day: 320, text: 'Such a warm, thoughtful host. Great communication and a really central location. Felt like a friend by the end.' },
  { id: 'r3', hostId: 'emma', authorId: 'amy', listingId: 'l-emma', day: 280, text: 'Clean, comfortable and easy from start to finish. She looked after everything. A real gem.' },
  { id: 'r4', hostId: 'emma', authorId: 'theo', listingId: 'l-emma', day: 150, text: 'Nice room and good location, though the wifi was a bit slow for working. Still a lovely stay overall.' },

  { id: 'r5', hostId: 'katelin', authorId: 'amy', listingId: 'l-katelin', day: 300, text: 'Katelin is so kind and generous. Spotless flat, responsive to every message, home away from home.' },
  { id: 'r6', hostId: 'katelin', authorId: 'lena', listingId: 'l-katelin', day: 220, text: 'Lovely balcony and a friendly, welcoming host. Took great care of the place and of me.' },
  { id: 'r7', hostId: 'katelin', authorId: 'ollie', listingId: 'l-katelin', day: 120, text: 'Comfortable and safe, no hesitation recommending. Good communication throughout.' },

  { id: 'r8', hostId: 'danica', authorId: 'you', listingId: 'l-danica', day: 200, text: 'Quiet garden flat, lovely and relaxed. Danica was welcoming and easy to reach.' },
  { id: 'r9', hostId: 'danica', authorId: 'sophie', listingId: 'l-danica', day: 90, text: 'Pet-friendly and clean, a comfortable stay. Communication could have been a little quicker but a kind host.' },

  { id: 'r10', hostId: 'ollie', authorId: 'katelin', listingId: 'l-ollie', day: 260, text: 'Central, immaculate studio and a seamless check-in. Trusted him completely, would stay again.' },
  { id: 'r11', hostId: 'ollie', authorId: 'nate', listingId: 'l-ollie', day: 140, text: 'Great spot and a helpful, friendly host. Really looked after the place.' },

  { id: 'r12', hostId: 'nate', authorId: 'bella', listingId: 'l-nate', day: 180, text: 'Nate was generous and welcoming, lovely balcony for working. Felt at ease straight away.' },
  { id: 'r13', hostId: 'priya', authorId: 'emma', listingId: 'l-priya', day: 210, text: 'Priya is warm and organised, spotless room and a safe, central location. A real pleasure.' },
];

// Reviews written ABOUT a guest. Powers the cold state's "her track record".
export const guestReviews: GuestReview[] = [
  { id: 'gr1', subjectId: 'priya', authorId: 'daniel', day: 379, text: 'Left the place cleaner than she found it. Easy to communicate with and would have her back any time.' },
  { id: 'gr2', subjectId: 'priya', authorId: 'maya', day: 358, text: 'Respectful of the space and really considerate. A genuinely lovely guest to host.' },
];

// Community contributions, used by src/pipeline/tiering.ts to compute standings.
const contrib = (memberId: string, kind: Contribution['kind'], day: number): Contribution => ({ memberId, kind, day });

export const contributions: Contribution[] = [
  contrib('emma', 'hosted', 360), contrib('emma', 'hosted', 320), contrib('emma', 'hosted', 280),
  contrib('emma', 'vouched', 300), contrib('emma', 'referred', 250), contrib('emma', 'attended', 340),
  contrib('katelin', 'hosted', 300), contrib('katelin', 'hosted', 220), contrib('katelin', 'vouched', 260),
  contrib('katelin', 'attended', 280), contrib('katelin', 'referred', 200),
  contrib('ollie', 'hosted', 260), contrib('ollie', 'reviewed', 260), contrib('ollie', 'attended', 150),
  contrib('danica', 'hosted', 200), contrib('danica', 'vouched', 210), contrib('danica', 'attended', 120),
  contrib('nate', 'hosted', 180), contrib('nate', 'referred', 160),
  contrib('priya', 'hosted', 210), contrib('priya', 'vouched', 190), contrib('priya', 'attended', 200),
  contrib('you', 'reviewed', 200), contrib('you', 'attended', 340), contrib('you', 'stayed', 200),
  contrib('amy', 'vouched', 300), contrib('amy', 'stayed', 300),
  contrib('sophie', 'reviewed', 320), contrib('sophie', 'attended', 300),
  contrib('bella', 'reviewed', 360), contrib('bella', 'vouched', 340),
  contrib('theo', 'attended', 150), contrib('lena', 'stayed', 220),
];

export const palette = { teal };
