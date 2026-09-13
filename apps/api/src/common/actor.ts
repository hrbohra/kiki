import { TRPCError } from '@trpc/server';
import type { PrismaService } from '../prisma/prisma.service';

/** Resolve the Member the authenticated user acts as. Users created at signup have no member
 *  profile until onboarding, so member-scoped writes require one. */
export async function actingMemberId(prisma: PrismaService, userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.memberId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Complete onboarding to act as a member.' });
  }
  return user.memberId;
}
