// Incoming stay requests — the host's real home screen. The Trust page is framed as answering
// one of these, but there was no inbox of them. Ordered by what needs a reply. No timers, by
// design: the copy on the screen makes a point of not counting down.

export type RequestState = 'needs' | 'waiting';

export interface StayRequest {
  id: string;
  personId: string;
  dates: string;
  nights: number;
  steps: number;
  state: RequestState;
  line: string; // one-sentence trust summary
  age: string;
}

export const REQUESTS: StayRequest[] = [
  {
    id: 'emma', personId: 'emma', dates: '14 Sep – 12 Oct', nights: 28, steps: 2, state: 'needs',
    line: 'Nina vouches for her. Two routes, both people you can call.',
    age: 'Asked 2 days ago',
  },
  {
    id: 'priya', personId: 'priya', dates: '2 Oct – 16 Oct', nights: 14, steps: 3, state: 'needs',
    line: 'Nobody you know has met her. Katelin invited her in.',
    age: 'Asked yesterday',
  },
  {
    id: 'danica', personId: 'danica', dates: '2 Oct – 23 Oct', nights: 21, steps: 1, state: 'waiting',
    line: 'You said yes. Danica is confirming her flights.',
    age: 'You replied 3 days ago',
  },
];

/** How many requests still need a reply — drives the nav badge and the header count. */
export function requestsNeedingReply(): number {
  return REQUESTS.filter((r) => r.state === 'needs').length;
}
