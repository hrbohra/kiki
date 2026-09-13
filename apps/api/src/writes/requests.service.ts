import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from '../common/idempotency.service';
import { actingMemberId } from '../common/actor';

export interface CreateRequestInput {
  listingId: string;
  fromDay: number;
  toDay: number;
  message?: string;
  idempotencyKey?: string;
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
}
