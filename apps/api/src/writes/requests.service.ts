import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from '../common/idempotency.service';
import { actingMemberId } from '../common/actor';
import { commitmentsProblem, type HouseItem } from '@kiki/domain';

export interface CreateRequestInput {
  listingId: string;
  fromDay: number;
  toDay: number;
  message?: string;
  idempotencyKey?: string;
  /** Ids of the listing's care items the guest agrees to look after. */
  commitments?: string[];
}

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idem: IdempotencyService,
  ) {}

  /** A guest requests to stay at a listing. */
  async create(userId: string, input: CreateRequestInput) {
    return this.idem.run(userId, input.idempotencyKey, async () => {
      const guestId = await actingMemberId(this.prisma, userId);
      const listing = await this.prisma.listing.findUnique({ where: { id: input.listingId } });
      if (!listing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found.' });
      if (listing.hostId === guestId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot request your own listing.' });
      }
      // The house list's care items are commitments: a request agrees to every one, and nothing
      // that isn't one. Stored as the text agreed to, so a later edit to the list can't change
      // what this guest said yes to.
      const items = (await this.prisma.houseItem.findMany({ where: { listingId: listing.id }, orderBy: { position: 'asc' } })) as unknown as HouseItem[];
      const agreed = input.commitments ?? [];
      const problem = commitmentsProblem(items, agreed);
      if (problem) throw new TRPCError({ code: 'BAD_REQUEST', message: problem });
      const commitments = items.filter((i) => i.section === 'care' && agreed.includes(i.id)).map((i) => i.text);
      const nights = Math.max(1, input.toDay - input.fromDay);
      return this.prisma.stayRequest.create({
        data: {
          listingId: listing.id,
          guestId,
          hostId: listing.hostId,
          fromDay: input.fromDay,
          toDay: input.toDay,
          nights,
          message: input.message ?? null,
          commitments,
        },
      });
    });
  }

  /** The host's inbox: requests for the acting member's listings, pending first. */
  async inbox(userId: string) {
    const hostId = await actingMemberId(this.prisma, userId);
    return this.prisma.stayRequest.findMany({
      where: { hostId },
      orderBy: [{ state: 'asc' }, { createdAt: 'desc' }],
      include: { guest: true, listing: true },
    });
  }

  /** The guest's own requests. */
  async mine(userId: string) {
    const guestId = await actingMemberId(this.prisma, userId);
    return this.prisma.stayRequest.findMany({
      where: { guestId },
      orderBy: { createdAt: 'desc' },
      include: { host: true, listing: true },
    });
  }

  /** The host accepts or declines. Only the listing's host may decide, once. */
  async decide(userId: string, input: { requestId: string; decision: 'accept' | 'decline' }) {
    const hostId = await actingMemberId(this.prisma, userId);
    const req = await this.prisma.stayRequest.findUnique({ where: { id: input.requestId } });
    if (!req) throw new TRPCError({ code: 'NOT_FOUND', message: 'Request not found.' });
    if (req.hostId !== hostId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the host can decide this request.' });
    }
    if (req.state !== 'pending') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'This request has already been decided.' });
    }
    return this.prisma.stayRequest.update({
      where: { id: req.id },
      data: { state: input.decision === 'accept' ? 'accepted' : 'declined', decidedAt: new Date() },
    });
  }

  /** Demo only: put the seeded decision state back (Maia + Priya pending, Danica accepted) so the
   *  shared public demo always has a request to decide on. Mirrors prisma/seed.ts. */
  async resetDemo() {
    // requests the demo visitor sent as a guest are theirs to try, not the next visitor's to find
    await this.prisma.stayRequest.deleteMany({ where: { guestId: 'you' } });
    const pending = await this.prisma.stayRequest.updateMany({
      where: { hostId: 'you', guestId: { in: ['emma', 'priya'] } },
      data: { state: 'pending', decidedAt: null },
    });
    const accepted = await this.prisma.stayRequest.updateMany({
      where: { hostId: 'you', guestId: 'danica' },
      data: { state: 'accepted', decidedAt: new Date() },
    });
    return { ok: true, pending: pending.count, accepted: accepted.count };
  }
}
