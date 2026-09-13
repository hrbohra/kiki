import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Stripe-style idempotency: a write with the same (user, key) returns the first stored result
 *  instead of running twice. No key ⇒ run normally. */
@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(userId: string, key: string | undefined, fn: () => Promise<T>): Promise<T> {
    if (!key) return fn();

    const found = await this.prisma.idempotencyKey.findUnique({
      where: { userId_key: { userId, key } },
    });
    if (found) return found.result as T;

    const result = await fn();
    await this.prisma.idempotencyKey.create({
      data: { userId, key, result: result as unknown as Prisma.InputJsonValue },
    });
    return result;
  }
}
