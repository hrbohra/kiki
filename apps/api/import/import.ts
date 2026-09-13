// Real-data import path (Phase 7). Loads members/listings/vouches/reviews from a JSON file into
// the DB, validated with Zod and idempotent (upsert), so Kiki can point DATABASE_URL at a staging
// branch and bring their own data in without touching app code.
//
//   pnpm --filter @kiki/api import ./import/sample.json
//
// PRIVACY: anonymise/strip PII BEFORE import for anything user-facing beyond what the product shows.
// The corpus of conversations is NEVER imported here — it is voice-only (see VOICE_PIPELINE.md).
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const TraitSchema = z.object({
  kind: z.enum(['origin', 'education', 'interest', 'work', 'event']),
  key: z.string(),
  label: z.string(),
  provenance: z.enum(['matched', 'inferred', 'self_declared']).optional(),
});

const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  avatarColor: z.string().default('#8895A7'),
  avatarUrl: z.string().url().optional(),
  traits: z.array(TraitSchema).default([]),
});

const ListingSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  title: z.string(),
  area: z.string(),
  pricePerNight: z.number().int(),
  kind: z.string(),
  lat: z.number(),
  lng: z.number(),
  photoColor: z.string().default('#CBD3DC'),
  photoUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
});

const VouchSchema = z.object({
  from: z.string(),
  to: z.string(),
  note: z.string().optional(),
  noteSubject: z.string().optional(),
  consentToDisplay: z.boolean().optional(),
  stays: z.number().int().optional(),
  sharedEvents: z.number().int().optional(),
});

const ReviewSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  authorId: z.string(),
  listingId: z.string(),
  text: z.string(),
  day: z.number().int(),
});

const ImportSchema = z.object({
  members: z.array(MemberSchema).default([]),
  listings: z.array(ListingSchema).default([]),
  vouches: z.array(VouchSchema).default([]),
  reviews: z.array(ReviewSchema).default([]),
});

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: import <path-to-json>');
    process.exit(1);
  }
  const parsed = ImportSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } } });

  for (const m of parsed.members) {
    await prisma.member.upsert({
      where: { id: m.id },
      update: { name: m.name, country: m.country, avatarColor: m.avatarColor, avatarUrl: m.avatarUrl ?? null },
      create: { id: m.id, name: m.name, country: m.country, avatarColor: m.avatarColor, avatarUrl: m.avatarUrl ?? null },
    });
    // Replace traits for this member (idempotent).
    await prisma.trait.deleteMany({ where: { memberId: m.id } });
    if (m.traits.length) {
      await prisma.trait.createMany({
        data: m.traits.map((t) => ({ memberId: m.id, kind: t.kind, key: t.key, label: t.label, provenance: t.provenance ?? 'self_declared' })),
      });
    }
  }

  for (const l of parsed.listings) {
    const data = {
      hostId: l.hostId, title: l.title, area: l.area, pricePerNight: l.pricePerNight,
      kind: l.kind, lat: l.lat, lng: l.lng, photoColor: l.photoColor, photoUrl: l.photoUrl ?? null, tags: l.tags,
    };
    await prisma.listing.upsert({ where: { id: l.id }, update: data, create: { id: l.id, ...data } });
  }

  for (const v of parsed.vouches) {
    const data = {
      note: v.note ?? null, noteSubject: v.noteSubject ?? null,
      consentToDisplay: v.consentToDisplay ?? false, stays: v.stays ?? null, sharedEvents: v.sharedEvents ?? null,
    };
    await prisma.vouch.upsert({
      where: { fromId_toId: { fromId: v.from, toId: v.to } },
      update: data,
      create: { fromId: v.from, toId: v.to, ...data },
    });
  }

  for (const r of parsed.reviews) {
    const data = { hostId: r.hostId, authorId: r.authorId, listingId: r.listingId, text: r.text, day: r.day };
    await prisma.review.upsert({ where: { id: r.id }, update: data, create: { id: r.id, ...data } });
  }

  console.log('Import complete:', {
    members: parsed.members.length,
    listings: parsed.listings.length,
    vouches: parsed.vouches.length,
    reviews: parsed.reviews.length,
  });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Import failed:', e);
  process.exit(1);
});
