// Synthetic direct-message threads. The messaging model is adapted from an earlier
// chat project of mine: an append-only list of messages per thread, newest-last, with a
// derived "last activity" for inbox sorting. In this demo it's static data; the shape is
// what a real store (or websocket feed) would hydrate.

export interface Message {
  id: string;
  fromId: string; // member id ("you" for the viewer)
  text: string;
  day: number;
}

export interface Thread {
  id: string;
  withId: string; // the other member
  messages: Message[]; // chronological
}

export const threads: Thread[] = [
  {
    id: 't-emma',
    withId: 'emma',
    messages: [
      { id: 'm1', fromId: 'you', text: 'Hi Maia! Nina pointed me your way — your De Beauvoir room looks lovely.', day: 396 },
      { id: 'm2', fromId: 'emma', text: 'Oh amazing, any friend of Nina’s! When are you thinking?', day: 396 },
      { id: 'm3', fromId: 'you', text: 'The 12th–15th. Also spotted we both did the Paris exchange in 2017 😄', day: 397 },
      { id: 'm4', fromId: 'emma', text: 'No way! Small world. Those dates work — happy to hold them for you.', day: 398 },
    ],
  },
  {
    id: 't-katelin',
    withId: 'katelin',
    messages: [
      { id: 'm5', fromId: 'you', text: 'Hi Katelin, Amy said wonderful things about staying with you.', day: 380 },
      { id: 'm6', fromId: 'katelin', text: 'Amy’s the best! Yes the Finsbury Park room is free end of the month.', day: 381 },
    ],
  },
  {
    id: 't-danica',
    withId: 'danica',
    messages: [
      { id: 'm7', fromId: 'danica', text: 'Thanks again for the stay in April — you left the place spotless!', day: 205 },
      { id: 'm8', fromId: 'you', text: 'Anytime! The garden was a dream for working. Would love to come back.', day: 206 },
    ],
  },
];

/** Last message day, for inbox ordering. */
export function lastDay(thread: Thread): number {
  return thread.messages.reduce((d, m) => Math.max(d, m.day), 0);
}

export function threadWith(memberId: string): Thread | undefined {
  return threads.find((t) => t.withId === memberId);
}
