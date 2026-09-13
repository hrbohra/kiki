import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { WORLD_NOW_DAY } from '@kiki/domain';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from '../common/idempotency.service';
import { WorldService } from '../world/world.service';
import { actingMemberId } from '../common/actor';

export interface AddGuestBookInput {
  hostId: string;
  listingId: string;
  text: string;
  idempotencyKey?: string;
}

@Injectable()
export class GuestBookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idem: IdempotencyService,
    private readonly world: WorldService,
  ) {}

  /** A guest writes a guest-book entry about a host after a stay. Feeds the NLP roll-up, so the
   *  cached world is invalidated. */
  async add(userId: string, input: AddGuestBookInput) {
    return this.idem.run(userId, input.idempotencyKey, async () => {
      const authorId = await actingMemberId(this.prisma, userId);
      const listing = await this.prisma.listing.findUnique({ where: { id: input.listingId } });
      if (!listing || listing.hostId !== input.hostId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'That listing does not belong to that host.' });
      }
      if (authorId === input.hostId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot review your own listing.' });
      }
      const review = await this.prisma.review.create({
        data: {
          id: `rev_${randomUUID()}`,
          hostId: input.hostId,
          authorId,
          listingId: input.listingId,
          text: input.text,
          day: WORLD_NOW_DAY,
        },
      });
      this.world.invalidate();
      return review;
    });
  }
}
