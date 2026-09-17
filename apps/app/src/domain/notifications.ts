// Notifications, deduplicated and actionable (17 Sep handoff, 2c). Three rules: anything with a
// person waiting goes under NEEDS YOU with its action inline; identical listing alerts group into
// one row with a count; copy says the fact once, with the degree. No exclamation marks. The badge
// counts only what needs you — "9+" on a bell trains people to ignore it.

import { plural } from './format';
import { stayLength } from './stay';
import * as world from '../world';

export interface InboxRequest { id: string; guestId: string; nights: number; state: 'pending' | 'accepted' | 'declined' }

export interface Notice {
  id: string;
  section: 'needs' | 'today' | 'earlier';
  memberId?: string; // avatar, when a person is the subject
  count?: number; // grouped rows
  title: string;
  body: string;
  when: string;
  action?: { label: string; to: { screen: 'Trust'; hostId: string; requestId: string } | { screen: 'GuestBook'; hostId: string } | { screen: 'Explore' } };
  secondary?: string; // a quiet "Later"
}

/** Build the list from the live inbox plus what the world knows. Pure apart from reading the world facade. */
export function buildNotices(inbox: InboxRequest[]): Notice[] {
  const out: Notice[] = [];
  const first = (id: string) => world.memberById(id).name.split(' ')[0];
  const price = world.listingForHost(world.viewerId)?.pricePerNight ?? 0;

  for (const r of inbox.filter((x) => x.state === 'pending')) {
    const story = world.trustStoryFor(r.guestId);
    const route = story.rankedRoutes[0]?.members ?? [];
    const mutual = route.length > 2 ? route[1].name.split(' ')[0] : null;
    // only a two-step mutual "vouches for" the guest; further out, say the distance and the way in
    const how = !story.reachable
      ? 'Nobody you know has met them. '
      : story.direct
        ? 'You know them yourself. '
        : route.length === 3 && story.warm
          ? `${mutual} vouches for ${first(r.guestId)}. `
          : `${route.length - 1} steps from you, through ${mutual}. `;
    out.push({
      id: `req-${r.id}`, section: 'needs', memberId: r.guestId,
      title: `${first(r.guestId)} wants to stay ${stayLength(r.nights)}`,
      body: `${how}£${(price * r.nights).toLocaleString('en-GB')} for the stay.`,
      when: '2 hrs ago',
      action: { label: 'Read their trust page', to: { screen: 'Trust', hostId: r.guestId, requestId: r.id } },
      secondary: 'Later',
    });
  }

  // the entry you owe — the seeded past stay in Tooting
  out.push({
    id: 'owed-danica', section: 'needs', memberId: 'danica',
    title: 'You owe Danica a guest-book entry',
    body: 'Your stay in Tooting. Two lines is plenty; it’s how her next guest knows her.',
    when: 'since your stay',
    action: { label: 'Write it', to: { screen: 'GuestBook', hostId: 'danica' } },
  });

  // who used your invite — the invite tree is the graph's backbone
  for (const p of world.inviteBranch()) {
    out.push({
      id: `invite-${p.member.id}`, section: 'today', memberId: p.member.id,
      title: `${p.member.name.split(' ')[0]} used your invite code`,
      body: `One step from you now. ${p.invited ? `${plural(p.invited, 'person has', 'people have')} come in through ${p.member.name.split(' ')[0]} since.` : 'Nothing yet, that’s normal.'}`,
      when: '18 hrs ago',
    });
  }

  // identical listing alerts, grouped into one row
  const near = world.allListings().filter((l) => l.hostId !== world.viewerId && world.degreeToHost(l.hostId) <= 2);
  if (near.length) {
    const names = near.slice(0, 3).map((l) => first(l.hostId));
    const oneStep = near.filter((l) => world.degreeToHost(l.hostId) === 1).length;
    out.push({
      id: 'rooms-near', section: 'earlier', count: near.length,
      title: `${plural(near.length, 'room fits', 'rooms fit')} your dates`,
      body: `${names.join(', ')}${near.length > 3 ? ' and more' : ''}. ${oneStep ? `${plural(oneStep, 'is', 'are')} one step from you.` : 'All within two steps of you.'}`,
      when: 'yesterday · grouped',
      action: { label: 'See them', to: { screen: 'Explore' } },
    });
  }
  return out;
}

/** The bell badge: only what needs you. */
export function needsYouCount(notices: Notice[]): number {
  return notices.filter((n) => n.section === 'needs').length;
}
