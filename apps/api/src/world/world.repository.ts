import { Injectable } from '@nestjs/common';
import {
  VIEWER_ID,
  WORLD_NOW_DAY,
  type Listing,
  type WorldData,
} from '@kiki/domain';
import { PrismaService } from '../prisma/prisma.service';

/** Loads all rows for the demo world from Postgres and maps them to @kiki/domain shapes.
 *  At demo scale a full load is fine; later phases can add per-query loading. */
@Injectable()
export class WorldRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(): Promise<WorldData> {
    const [members, vouches, listings, reviews, guestReviews, contributions] = await Promise.all([
      this.prisma.member.findMany({ include: { traits: true } }),
      this.prisma.vouch.findMany(),
      this.prisma.listing.findMany(),
      this.prisma.review.findMany(),
      this.prisma.guestReview.findMany(),
      this.prisma.contribution.findMany(),
    ]);

    return {
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        country: m.country,
        avatarColor: m.avatarColor,
        avatarUrl: m.avatarUrl ?? undefined,
        traits: m.traits.map((t) => ({
          kind: t.kind,
          key: t.key,
          label: t.label,
          provenance: t.provenance,
        })),
      })),
      vouches: vouches.map((v) => ({
        from: v.fromId,
        to: v.toId,
        note: v.note ?? undefined,
        noteSubject: v.noteSubject ?? undefined,
        consentToDisplay: v.consentToDisplay,
        stays: v.stays ?? undefined,
        sharedEvents: v.sharedEvents ?? undefined,
      })),
      listings: listings.map((l) => ({
        id: l.id,
        hostId: l.hostId,
        title: l.title,
        area: l.area,
        pricePerNight: l.pricePerNight,
        kind: l.kind as Listing['kind'],
        lat: l.lat,
        lng: l.lng,
        photoColor: l.photoColor,
        photoUrl: l.photoUrl ?? undefined,
        tags: l.tags,
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        hostId: r.hostId,
        authorId: r.authorId,
        listingId: r.listingId,
        text: r.text,
        day: r.day,
      })),
      guestReviews: guestReviews.map((g) => ({
        id: g.id,
        subjectId: g.subjectId,
        authorId: g.authorId,
        text: g.text,
        day: g.day,
      })),
      contributions: contributions.map((c) => ({
        memberId: c.memberId,
        kind: c.kind,
        day: c.day,
      })),
      nowDay: WORLD_NOW_DAY,
      viewerId: VIEWER_ID,
    };
  }
}
