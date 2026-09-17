// The invite is a person, not a code. Kiki is invite-only and the trust model begins here — so
// this is the first thing a new member sees. The code is shown once, small, labelled as plumbing.

export const INVITE = {
  fromId: 'bella',
  fromName: 'Nina',
  code: 'KIKI·NINA·3F2A',
  sent: '4 days ago',
  quote: 'We were flatmates in Auckland for two years. She is the first person I would trust with my place.',
} as const;

export type OnboardFactKind = 'hometown' | 'studied' | 'climb' | 'work';

export interface OnboardFact {
  kind: OnboardFactKind;
  label: string;
  sub: string;
  on: boolean;
}

export const ONBOARD_FACTS: OnboardFact[] = [
  { kind: 'hometown', label: 'Mount Eden', sub: 'Where you moved from', on: true },
  { kind: 'studied', label: 'Paris, 2017', sub: 'Where you studied', on: true },
  { kind: 'climb', label: 'Blok Shoreditch', sub: 'Where you climb', on: true },
  { kind: 'work', label: 'Product design', sub: 'What you do', on: false },
];

export const ONBOARD_STEPS = [
  { key: 'claim', label: 'Your invite' },
  { key: 'facts', label: 'What you bring' },
  { key: 'stakes', label: 'What this costs you' },
  { key: 'covers', label: 'What Kiki carries' },
  { key: 'done', label: 'Done' },
] as const;
