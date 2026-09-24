import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from '../common/idempotency.service';
import { actingMemberId } from '../common/actor';

export interface CreateTripInput {
  title: string;
  kind: string;
  fromDay: number;
  toDay: number;
  budgetPerNight: number;
  idempotencyKey?: string;
}

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idem: IdempotencyService,
  ) {}

  /** Post the weeks you are away (looking for a Kikier). */
  async create(userId: string, input: CreateTripInput) {
    return this.idem.run(userId, input.idempotencyKey, async () => {
      const authorId = await actingMemberId(this.prisma, userId);
      if (input.toDay - input.fromDay < 7) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Kiki stays are a week or longer.' });
      const nights = input.toDay - input.fromDay;
      return this.prisma.trip.create({
        data: {
          authorId,
          title: input.title,
          kind: input.kind,
          fromDay: input.fromDay,
          toDay: input.toDay,
          nights,
          budgetPerNight: input.budgetPerNight,
        },
      });
    });
  }

  /** Demo only: trips the demo visitor posted (they have no offers) are theirs to try, not the next
   *  visitor's to find. The seeded trip, which has offers, stays. */
  async resetDemo(): Promise<number> {
    const r = await this.prisma.trip.deleteMany({ where: { authorId: 'you', offers: { none: {} } } });
    return r.count;
  }

  /** The traveller's own trips, with any offers. */
  async mine(userId: string) {
    const authorId = await actingMemberId(this.prisma, userId);
    return this.prisma.trip.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      include: { offers: { include: { host: true } } },
    });
  }
}
