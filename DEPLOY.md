# Deploying Kiki

Three moving parts: the **API** (NestJS + Prisma + tRPC + WebSockets) on Render, **Postgres** on
Neon, and the **web export** of the app embedded in the showcase site on Vercel. All three run on
free tiers; a scheduled ping keeps the API warm.

## 1. Database (Neon)

Create a Postgres project and take both connection strings: the pooled one as `DATABASE_URL`, the
direct one as `DIRECT_URL` (migrations and the seed use the direct connection).

```bash
pnpm --filter @kiki/api exec prisma migrate deploy
pnpm --filter @kiki/api exec prisma db seed      # the demo world: members, listings, vouches, threads
```

## 2. API (Render)

`render.yaml` at the repo root is a Render Blueprint. On render.com choose **New → Blueprint**,
connect the `kiki` repo, and it reads the file. Set the secret variables when prompted:

| Variable | Purpose |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Neon connection strings |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | token signing (15-minute access, rotating refresh) |
| `GEMINI_API_KEY` | the model, called server-side only; the key never reaches a client |
| `EMAIL_API_KEY`, `EMAIL_FROM` | Resend, for the real invite → OTP flow |

`DEMO_MODE=1`, `NODE_ENV` and `GEMINI_MODEL` are preset in the blueprint. Build gotchas that the
blueprint already handles: Node is pinned by `.node-version` (22), pnpm is installed with
`npm i -g pnpm` rather than corepack, and `pnpm install --prod=false` keeps devDependencies so the
build can run.

Verify:

```
https://<your-service>.onrender.com/health    → {"ok":true}
https://<your-service>.onrender.com/summary   → member and listing counts
```

## 3. Web export (Vercel, via the showcase repo)

The app is exported for the web twice, once per mount path, and copied into the showcase repo:

```bash
cd apps/app
# set expo.experiments.baseUrl to "/app", then "/try/app", in app.json for each export
EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com npx expo export --platform web
# copy dist/ to <showcase>/app and <showcase>/try/app, then deploy the showcase with `vercel --prod`
```

The API URL is the only value baked into the client.

## 4. Keeping the free tier warm

Render's free service sleeps after ~15 minutes idle and cold-starts in about 30 seconds.
`.github/workflows/keepalive.yml` pings `/health` every 10 minutes from GitHub Actions, which keeps
a single service inside the free monthly allowance.

## Notes

- Real-time messaging works on one instance through the in-memory pub/sub. To run more than one
  instance, set `MESSAGE_BUS=redis` and `REDIS_URL`; the Redis adapter is already in the codebase.
- The demo has a one-tap sign-in and a demo-only reset (`demo.reset`) that restores the seeded
  requests, so a shared public demo is never left in a spent state. Both are gated by `DEMO_MODE`.
- Railway or Fly.io would host the API the same way (Fly needs a Dockerfile).
