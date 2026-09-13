import { Injectable } from '@nestjs/common';
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

  /** Post a trip (out for offers). */
  async create(userId: string, input: CreateTripInput) {
    return this.idem.run(userId, input.idempotencyKey, async () => {
      const authorId = await actingMemberId(this.prisma, userId);
      const nights = Math.max(1, input.toDay - input.fromDay);
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
