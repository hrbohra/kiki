// Fill (or restore) the demo world's house lists in an existing database without a full reseed,
// and record what the seeded guests agreed to look after at "your place". Idempotent.
// Run: pnpm --filter @kiki/api exec dotenv -e ../../.env -- tsx import/seed-house-lists.ts
import { PrismaClient } from '@prisma/client';
import { HOUSE_LISTS } from '@kiki/domain';
import { HouseListService } from '../src/writes/houselist.service';
import type { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } } });

(async () => {
  const n = await new HouseListService(prisma as unknown as PrismaService).restoreSeeded();
  const care = HOUSE_LISTS['l-you'].filter((i) => i.section === 'care').map((i) => i.text);
  const r = await prisma.stayRequest.updateMany({ where: { listingId: 'l-you', guestId: { in: ['emma', 'priya', 'danica'] } }, data: { commitments: care } });
  console.log(`house items: ${n}; seeded requests updated: ${r.count}`);
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
