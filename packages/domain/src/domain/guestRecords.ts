// "The host" and "The guest" answer two different questions. Hosting evidence says how someone
// keeps their OWN place; guest evidence says how they treat YOURS. Most members only have the
// first — this data makes that asymmetry explicit rather than hiding it. Maia and Danica are
// well-evidenced hosts with an entirely empty guest side; Priya, whom nobody knows, is the only
// one with a guest record, and it is two entries from strangers.

export interface GuestCount {
  label: string;
  value: string;
  note: string;
}

export interface GuestEntry {
  /** Member id when we have a face for the author, else a stable slug (renders as an initial). */
  authorId: string;
  name: string;
  known: boolean;
  text: string;
}

export interface GuestRecord {
  has: boolean; // is there any guest evidence at all?
  title: string;
  body: string;
  counts: GuestCount[];
  fallbackTitle: string;
  fallbackBody: string;
  entries: GuestEntry[];
}

const RECORDS: Record<string, GuestRecord> = {
  emma: {
    has: false,
    title: 'Maia has never been a guest on Kiki.',
    body: 'Everything on the host side describes how she keeps her own flat. None of it tells you how she treats someone else’s, which is the thing you’d be finding out.',
    counts: [
      { label: 'Stays as a guest', value: '0', note: 'Nothing to read' },
      { label: 'Written about her as a guest', value: '0 people', note: 'Nobody has hosted her' },
      { label: 'Cancellations', value: 'None', note: 'Also none to have' },
      { label: 'On Kiki since', value: 'Jul 2025', note: '13 months, hosting only' },
    ],
    fallbackTitle: 'What you have instead',
    fallbackBody: 'Two people you know will vouch for her character, and she has kept her own place well for four guests. That is not the same evidence. Decide whether it is enough.',
    entries: [],
  },
  danica: {
    has: false,
    title: 'Danica has never been a guest on Kiki.',
    body: 'You stayed at hers in April, so you know how she keeps her own flat. You have never seen her in someone else’s.',
    counts: [
      { label: 'Stays as a guest', value: '0', note: 'Nothing to read' },
      { label: 'Written about her as a guest', value: '0 people', note: 'Nobody has hosted her' },
      { label: 'Cancellations', value: 'None', note: 'Also none to have' },
      { label: 'On Kiki since', value: 'Feb 2026', note: '6 months, hosting only' },
    ],
    fallbackTitle: 'What you have instead',
    fallbackBody: 'You know her yourself, which is the strongest link Kiki can show you. It is still not evidence about how she treats a flat that is not hers.',
    entries: [],
  },
  priya: {
    has: true,
    title: 'Priya has stayed with two people. Both wrote her a good entry.',
    body: 'This is the one place where Priya has more to show than the hosts you know well. Neither author is in your circle, so you cannot go and ask — read the words and decide what they are worth.',
    counts: [
      { label: 'Stays as a guest', value: '2', note: 'Mar 2026, Jun 2026' },
      { label: 'Written about her as a guest', value: '2 people', note: 'Neither known to you' },
      { label: 'Cancellations', value: 'None', note: 'Across 2 stays' },
      { label: 'On Kiki since', value: 'Nov 2025', note: '9 months' },
    ],
    fallbackTitle: 'Why this is thinner than it looks',
    fallbackBody: 'Two entries is a small sample, and you know neither author. A good word from a stranger is still a stranger’s word.',
    entries: [
      { authorId: 'daniel', name: 'Daniel', known: false, text: 'Left the place cleaner than she found it. Easy to communicate with and would have her back any time.' },
      { authorId: 'lena', name: 'Lena', known: false, text: 'Quiet, tidy, and she watered everything while I was away. No notes.' },
    ],
  },
};

/** Guest-side record for a host. Falls back to an honest empty shape for anyone unfixtured. */
export function guestRecordFor(hostId: string): GuestRecord {
  return (
    RECORDS[hostId] ?? {
      has: false,
      title: 'No guest record yet.',
      body: 'Everything we have describes how they keep their own place, not how they treat someone else’s.',
      counts: [
        { label: 'Stays as a guest', value: '0', note: 'Nothing to read' },
        { label: 'Written about them as a guest', value: '0 people', note: 'Nobody has hosted them' },
        { label: 'Cancellations', value: 'None', note: 'Also none to have' },
        { label: 'On Kiki since', value: '—', note: 'Hosting only' },
      ],
      fallbackTitle: 'What you have instead',
      fallbackBody: 'Read the host side and decide whether it is enough — it is a different question.',
      entries: [],
    }
  );
}
