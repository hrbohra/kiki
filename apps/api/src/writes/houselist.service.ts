import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { HOUSE_LISTS, type HouseItem, type HouseItemKind, type HouseSection } from '@kiki/domain';
import { PrismaService } from '../prisma/prisma.service';
import { actingMemberId } from '../common/actor';

export interface HouseItemInput {
  section: HouseSection;
  text: string;
  detail?: string;
  kind?: HouseItemKind;
}

/**
 * A host's house list: rules, things they'd love, things a guest would look after. Stored per
 * listing and read on its own, never folded into the world snapshot, so editing it cannot move a
 * degree, a route or an overlap.
 */
@Injectable()
export class HouseListService {
  constructor(private readonly prisma: PrismaService) {}

  async get(listingId: string): Promise<HouseItem[]> {
    const rows = await this.prisma.houseItem.findMany({ where: { listingId }, orderBy: { position: 'asc' } });
    return rows.map(toItem);
  }

  /** Replace the whole list. Only the listing's host may; ids are regenerated so a care item a
   *  guest agreed to earlier can never silently change meaning under them. */
  async set(userId: string, listingId: string, items: HouseItemInput[]): Promise<HouseItem[]> {
    const me = await actingMemberId(this.prisma, userId);
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found.' });
    if (listing.hostId !== me) throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the host can edit this house list.' });
    const stamp = Date.now().toString(36);
    const data = items.map((it, i) => ({
      id: `${listingId}:${it.section}:${stamp}${i}`,
      listingId,
      section: it.section,
      text: it.text.trim(),
      detail: it.detail?.trim() || null,
      kind: it.kind ?? null,
      position: i,
    }));
    await this.prisma.$transaction([
      this.prisma.houseItem.deleteMany({ where: { listingId } }),
      this.prisma.houseItem.createMany({ data }),
    ]);
    return this.get(listingId);
  }

  /** Seed (or restore) the demo world's lists for these listings. Idempotent. */
  async restoreSeeded(listingIds: string[] = Object.keys(HOUSE_LISTS)): Promise<number> {
    const existing = new Set((await this.prisma.listing.findMany({ where: { id: { in: listingIds } }, select: { id: true } })).map((l) => l.id));
    const ids = listingIds.filter((id) => existing.has(id));
    const data = ids.flatMap((id) => HOUSE_LISTS[id].map((it, i) => ({ id: it.id, listingId: id, section: it.section, text: it.text, detail: it.detail ?? null, kind: it.kind ?? null, position: i })));
    await this.prisma.$transaction([
      this.prisma.houseItem.deleteMany({ where: { listingId: { in: ids } } }),
      this.prisma.houseItem.createMany({ data }),
    ]);
    return data.length;
  }
}

function toItem(r: { id: string; section: string; text: string; detail: string | null; kind: string | null }): HouseItem {
  return {
    id: r.id,
    section: r.section as HouseSection,
    text: r.text,
    ...(r.detail ? { detail: r.detail } : {}),
    ...(r.kind ? { kind: r.kind as HouseItemKind } : {}),
  };
}
