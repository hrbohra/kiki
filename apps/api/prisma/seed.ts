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
} from '@kiki/domain';

// Seeding is a one-off admin task — use the direct (non-pooled) connection, which is the
// reliable path for bulk writes and migrations (the pooled endpoint is for app runtime).
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main(): Promise<void> {
  // Clear in FK-safe order.
  await prisma.generatedContent.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.guestReview.deleteMany();
  await prisma.review.deleteMany();
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
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
