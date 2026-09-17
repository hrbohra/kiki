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

  /** Add or remove one of the acting member's own facts. A label another member already
   *  declared (same kind, same text, case-insensitive) reuses their canonical key, so the
   *  overlap shows on both sides at once; otherwise a new key is minted. Only self-declared
   *  facts are removable: inferred / matched ones are the system's and stay labelled as such. */
  async setTrait(userId: string, input: { kind: 'origin' | 'education' | 'interest' | 'work' | 'event'; label: string; on: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.memberId) throw new Error('Complete onboarding to act as a member.');
    const memberId = user.memberId;
    const label = input.label.trim().replace(/\s+/g, ' ');
    const existing = await this.prisma.trait.findFirst({ where: { kind: input.kind, label: { equals: label, mode: 'insensitive' } } });
    const key = existing?.key ?? input.kind + ':' + normalise(label);
    const mine = await this.prisma.trait.findFirst({ where: { memberId, kind: input.kind, OR: [{ key }, { label: { equals: label, mode: 'insensitive' } }] } });
    if (!input.on) {
      if (mine && mine.provenance === 'self_declared') await this.prisma.trait.delete({ where: { id: mine.id } });
      return { ok: true, key, on: false };
    }
    if (mine) return { ok: true, key: mine.key, on: true };
    await this.prisma.trait.create({ data: { memberId, kind: input.kind, key, label, provenance: 'self_declared' } });
    return { ok: true, key, on: true };
  }

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

/** Lowercase, drop a leading article, hyphenate: 'Blok Shoreditch' -> 'blok-shoreditch'. */
function normalise(label: string): string {
  return label.toLowerCase().replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
