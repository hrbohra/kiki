# Deploying the Kiki API (Render) + wiring the live public demo

The API is a long-lived Node service (NestJS + Prisma + tRPC + WebSockets). Render's free web
service supports WebSockets and connects to your existing Neon Postgres, so real-time messaging
keeps working. `render.yaml` is already in the repo.

## Your steps (need your accounts)

### 1. Push the monorepo to GitHub
Render builds from a Git repo. Create a repo (e.g. `hrbohra/kiki`) and push:
```bash
cd C:\dev\kiki
git remote add origin https://github.com/hrbohra/kiki.git
git push -u origin main
```
(Or tell me the remote and I'll push it — commits are already Harsh-only.)

### 2. Create the Render service from the blueprint
- render.com → New → **Blueprint** → connect the `kiki` repo → it reads `render.yaml`.
- When prompted, set the secret env vars (values are in your local `C:\dev\kiki\.env`):
  `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
  `EMAIL_API_KEY`, `EMAIL_FROM`. (`DEMO_MODE=1`, `NODE_ENV`, `GEMINI_MODEL` are preset.)
- Deploy. You'll get a URL like `https://kiki-api.onrender.com`.

### 3. Verify
```
https://kiki-api.onrender.com/health   → {"ok":true}
https://kiki-api.onrender.com/summary  → members/listings counts
```

### 4. Tell me the URL
I'll then re-export the app web build against it and re-embed it in the portfolio, so the public
demo is truly live end-to-end (one-tap in → real data → real messaging).

## What I do after you give me the URL
```bash
cd C:\dev\kiki\apps\app
EXPO_PUBLIC_API_URL=https://kiki-api.onrender.com npx expo export --platform web
# copy dist -> kiki-portfolio/app  (and a /try/app variant), then redeploy the portfolio
```

## Notes
- **Free tier sleeps** after ~15 min idle; the first hit cold-starts (~30s). Fine for a demo; a
  paid instance or a cron ping keeps it warm.
- Real-time works because it's a single long-lived instance (in-memory pub/sub). To scale to
  multiple instances later, flip `MESSAGE_BUS=redis` + `REDIS_URL` (the adapter is already built).
- Alternatives with the same shape: Railway or Fly.io (Fly needs a Dockerfile).
