// Seed the demo world from @kiki/domain fixtures + baked AI content. Idempotent: clears then
// re-inserts. The SAME schema accepts Kiki's real imported data later (see Phase 7 import module).
import { PrismaClient } from '@prisma/client';
import {
  members,
  vouches,
  listings,
  reviews,
  guestReviews,
  contributions,
  bakedIntro,
  bakedBio,
  bakedGuestBook,
  HOUSE_LISTS,
} from '@kiki/domain';

// Seeding is a one-off admin task — use the direct (non-pooled) connection, which is the
// reliable path for bulk writes and migrations (the pooled endpoint is for app runtime).
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main(): Promise<void> {
  // Clear in FK-safe order (auth tables first, then the world).
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.otpToken.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.user.deleteMany();
  await prisma.generatedContent.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.guestReview.deleteMany();
  await prisma.review.deleteMany();
  await prisma.houseItem.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.vouch.deleteMany();
  await prisma.trait.deleteMany();
  await prisma.member.deleteMany();

  // Members (+ their traits).
  for (const m of members) {
    await prisma.member.create({
      data: {
        id: m.id,
        name: m.name,
        country: m.country,
        avatarColor: m.avatarColor,
        traits: {
          create: m.traits.map((t) => ({
            kind: t.kind,
            key: t.key,
            label: t.label,
            provenance: t.provenance ?? 'self_declared',
          })),
        },
      },
    });
  }

  for (const l of listings) {
    await prisma.listing.create({
      data: {
        id: l.id,
        hostId: l.hostId,
        title: l.title,
        area: l.area,
        pricePerNight: l.pricePerNight,
        kind: l.kind,
        lat: l.lat,
        lng: l.lng,
        photoColor: l.photoColor,
        tags: l.tags,
      },
    });
  }

  for (const v of vouches) {
    await prisma.vouch.create({
      data: {
        fromId: v.from,
        toId: v.to,
        note: v.note ?? null,
        noteSubject: v.noteSubject ?? null,
        consentToDisplay: v.consentToDisplay ?? false,
        stays: v.stays ?? null,
        sharedEvents: v.sharedEvents ?? null,
        kind: v.kind ?? null,
      },
    });
  }

  for (const r of reviews) {
    await prisma.review.create({
      data: {
        id: r.id,
        hostId: r.hostId,
        authorId: r.authorId,
        listingId: r.listingId,
        text: r.text,
        day: r.day,
      },
    });
  }

  for (const g of guestReviews) {
    await prisma.guestReview.create({
      data: { id: g.id, subjectId: g.subjectId, authorId: g.authorId, text: g.text, day: g.day },
    });
  }

  for (const c of contributions) {
    await prisma.contribution.create({
      data: { memberId: c.memberId, kind: c.kind, day: c.day },
    });
  }

  // Baked AI content (intro / bio / guest-book summary), where present.
  for (const m of members) {
    const intro = bakedIntro(m.id);
    const bio = bakedBio(m.id);
    const guestBook = bakedGuestBook(m.id);
    if (intro || bio || guestBook) {
      await prisma.generatedContent.create({
        data: {
          memberId: m.id,
          intro: intro ?? null,
          bio: bio ?? null,
          guestBook: guestBook ? (guestBook as object) : undefined,
        },
      });
    }
  }

  // Bootstrap: an account for the demo viewer ("you") + a root invite for testing signups.
  const rootEmail = (process.env.SEED_ROOT_EMAIL || 'you@kiki.demo').toLowerCase();
  const rootUser = await prisma.user.create({
    data: { email: rootEmail, name: 'You', memberId: 'you' },
  });
  const rootInvite = 'KIKI-FOUNDER';
  await prisma.invite.create({ data: { code: rootInvite, createdById: rootUser.id } });

  // A host account (linked to member 'danica') so host-side writes (decide/inbox) are testable.
  await prisma.user.create({ data: { email: 'danica@kiki.demo', name: 'Danica', memberId: 'danica' } });

  // Messaging demo threads (you <-> Maia/Katelin/Danica), so the inbox is populated live.
  const threadSeeds: { with: string; msgs: [string, string][] }[] = [
    {
      with: 'emma',
      msgs: [
        ['you', 'Hi Maia! Nina pointed me your way — your De Beauvoir room looks lovely.'],
        ['emma', "Oh amazing, any friend of Nina's! When are you thinking?"],
        ['you', 'The 12th–15th. Also spotted we both did the Paris exchange in 2017 😄'],
        ['emma', 'No way! Small world. Those dates work — happy to hold them for you.'],
      ],
    },
    {
      with: 'katelin',
      msgs: [
        ['you', 'Hi Katelin, Amy said wonderful things about staying with you.'],
        ['katelin', "Amy's the best! Yes the Finsbury Park room is free end of the month."],
      ],
    },
    {
      with: 'danica',
      msgs: [
        ['danica', 'Thanks again for the stay in April — you left the place spotless!'],
        ['you', 'Anytime! The garden was a dream for working. Would love to come back.'],
      ],
    },
  ];
  let ts = Date.now() - 7 * 86_400_000;
  for (const t of threadSeeds) {
    const [aId, bId] = ['you', t.with].sort();
    const thread = await prisma.thread.create({ data: { aId, bId } });
    for (const [senderId, text] of t.msgs) {
      await prisma.message.create({ data: { threadId: thread.id, senderId, text, createdAt: new Date(ts) } });
      ts += 3_600_000;
    }
    await prisma.thread.update({ where: { id: thread.id }, data: { updatedAt: new Date(ts) } });
  }

  // Make the demo viewer ("you") a host with a listing + a few live stay requests, so the Requests
  // screen is real and interactive (accept/decline persists).
  await prisma.listing.create({
    data: {
      id: 'l-you', hostId: 'you', title: 'Your place', area: 'De Beauvoir, London',
      pricePerNight: 46, kind: 'Whole place', lat: 51.539, lng: -0.081, photoColor: '#D9E2DE',
      tags: ['Quiet', 'WFH desk', 'Near tube'],
    },
  });
  const stayReqs: { guest: string; fromDay: number; toDay: number; state: 'pending' | 'accepted'; message: string }[] = [
    { guest: 'emma', fromDay: 396, toDay: 424, state: 'pending', message: 'Four weeks from the 12th would be perfect if it works!' },
    { guest: 'priya', fromDay: 402, toDay: 416, state: 'pending', message: 'A wedding, then two weeks working from London.' },
    { guest: 'danica', fromDay: 359, toDay: 380, state: 'accepted', message: 'Thanks for saying yes!' },
  ];
  for (const r of stayReqs) {
    await prisma.stayRequest.create({
      data: {
        listingId: 'l-you', hostId: 'you', guestId: r.guest,
        fromDay: r.fromDay, toDay: r.toDay, nights: r.toDay - r.fromDay, message: r.message,
        state: r.state, decidedAt: r.state === 'accepted' ? new Date() : null,
        // each guest agreed to what they'd look after at yours when they asked
        commitments: HOUSE_LISTS['l-you'].filter((i) => i.section === 'care').map((i) => i.text),
      },
    });
  }

  // House lists: every seeded home's rules, things the host would love, things a guest would look after.
  for (const [listingId, items] of Object.entries(HOUSE_LISTS)) {
    await prisma.houseItem.createMany({
      data: items.map((it, position) => ({ id: it.id, listingId, section: it.section, text: it.text, detail: it.detail ?? null, kind: it.kind ?? null, position })),
    });
  }

  // Six weeks away that "you" posted, with a couple of partial offers to cover the rent.
  const trip = await prisma.trip.create({
    data: { authorId: 'you', title: 'Italy for Mum’s 60th', kind: 'Beach', fromDay: 500, toDay: 542, nights: 42, budgetPerNight: 45, state: 'open' },
  });
  await prisma.tripOffer.create({ data: { tripId: trip.id, hostId: 'nate', nights: 35, total: 1575, requestedFromDay: 507, requestedToDay: 542, note: '5 of your 6 weeks — more than most get this season.' } });
  await prisma.tripOffer.create({ data: { tripId: trip.id, hostId: 'priya', nights: 21, total: 945, requestedFromDay: 500, requestedToDay: 521, note: null } });

  const counts = {
    members: members.length,
    listings: listings.length,
    vouches: vouches.length,
    reviews: reviews.length,
    guestReviews: guestReviews.length,
    contributions: contributions.length,
  };
  // eslint-disable-next-line no-console
  console.log('Seed complete:', counts);
  // eslint-disable-next-line no-console
  console.log('Bootstrap account:', rootEmail, '| root invite code:', rootInvite);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
