// Generate a club-sized synthetic world and write it in the import format, so the same path that
// would take Kiki's real rows can take 5,000 seeded ones:
//
//   pnpm --filter @kiki/api seed:world                # → import/world.seed.json (+ stats on stdout)
//   pnpm --filter @kiki/api seed:world 2000 42        # members, seed
//   pnpm --filter @kiki/api import:data import/world.seed.json   # load it into a staging DB
//
// Nothing here touches the public demo: the demo world stays the 14 people the screens are
// written around. This exists so the graph can be measured at scale (see the design record).
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateWorld, worldStats } from '@kiki/domain';

const members = Number(process.argv[2] ?? 5000);
const seed = Number(process.argv[3] ?? 20260917);
const world = generateWorld({ members, seed });

const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  seed,
  members: world.members.map(({ id, name, country, avatarColor, traits }) => ({ id, name, country, avatarColor, traits })),
  listings: world.listings,
  vouches: world.vouches.map(({ from, to, note, noteSubject, consentToDisplay, stays, sharedEvents, kind }) => ({ from, to, note, noteSubject, consentToDisplay, stays, sharedEvents, kind })),
  reviews: [],
  guestReviews: world.guestReviews,
};

const file = resolve(__dirname, 'world.seed.json');
writeFileSync(file, JSON.stringify(out));
console.log('wrote', file);
console.log(JSON.stringify(worldStats(world), null, 1));
