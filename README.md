# Kiki

A trust-first sublet network — real full-stack build. Monorepo mirroring Kiki's production stack
(React Native · TypeScript · NestJS · Postgres · Vercel).

**Live demo:** https://kiki-portfolio-one.vercel.app — one tap into a seeded world (invite-only sign-in,
live messaging, AI-written intros).
**Design record** (architecture, decisions, trade-offs): https://kiki-portfolio-one.vercel.app/design

## Layout

```
packages/
  domain/     @kiki/domain — pure business logic (types, trust graph, similarity, geo,
              mutual-friend intro, composed "world" read model). No IO/UI. Node-testable.
apps/
  api/        NestJS backend — system of record (Postgres/Prisma, tRPC, auth)   [Phase 1+]
  mobile/     React Native (Expo) app                                            [migrated in later phases]
  web/        React Native Web / Next.js app                                     [migrated in later phases]
  showcase/   static design record + demo embeds                                 [Phase 1+]
```

## Getting started

```bash
pnpm install
cp .env.example .env      # then fill in DATABASE_URL etc.
pnpm test                 # runs the @kiki/domain vitest suite
pnpm typecheck
```

Env lives in a single root `.env` (never committed) — every package/app reads from it.

## Status

Built in shippable phases; see `C:\dev\WorkSummaryHarsh\KIKI_REAL_APP_PLAN.md` for the roadmap.
- **Phase 0 (done):** monorepo + `@kiki/domain` extracted, tests green.
