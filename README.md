# Kiki

[![CI](https://github.com/hrbohra/kiki/actions/workflows/ci.yml/badge.svg)](https://github.com/hrbohra/kiki/actions/workflows/ci.yml)

A working build of Kiki, the invite-only sublet club, on its own stack
(React Native · TypeScript · NestJS · Postgres), built end to end by Harsh Bohra.

**Live demo:** https://kiki-portfolio-one.vercel.app — one tap into a seeded world; no account, no email.
**Design record** (the decisions, with their proof): https://kiki-portfolio-one.vercel.app/design

## What's here

```
packages/
  domain/      @kiki/domain — pure business logic: types, trust graph, similarity, geo, the
               mutual-friend intro, the composed "world" read model. No IO, no UI. 49 unit tests.
  api-client/  @kiki/api-client — the typed tRPC client, compiled against the API's exported
               contract, so a changed endpoint fails the build rather than the user.
  voice/       @kiki/voice — the plug-in port (and blueprint) for giving the AI Kiki's voice.
apps/
  api/         NestJS backend — Postgres via Prisma, tRPC over HTTP + WebSocket, invite → OTP →
               rotating JWT auth, real-time messaging, media, the AI intro service, a demo reset.
               Deployed on Render. 5 integration tests against a real database.
  app/         One React Native (Expo) source for the native iOS app and the web: phone layouts
               and a wide desktop layout from the same screens. Exported to the web for the demo.
```

The showcase site (the phone emulator, the desktop embed and the design record) lives in a separate
repo, `hrbohra/kiki-showcase`, and embeds the web export of `apps/app`.

## Getting started

```bash
pnpm install
cp .env.example .env               # DATABASE_URL etc.; the model key never enters the client
pnpm build                         # domain + voice + api (refreshes the typed contract)
pnpm typecheck
pnpm --filter @kiki/domain test    # 49 tests, no database needed
pnpm --filter @kiki/api test       # 5 integration tests against a real Postgres (DATABASE_URL)
pnpm --filter @kiki/app start      # native build via Expo Go, or `expo start --web`
```

Env lives in one root `.env` (never committed; `.env.example` is the template).

## What shipped

- **The domain is shared verbatim.** The graph, similarity and trust-story logic are one pure
  package the server and the app both import, so the demo and the backend compute the same answers.
- **A real backend.** Invite-only passwordless sign-in with rotating refresh tokens and reuse
  detection; persisted stay requests, trips and guest-book entries; real-time messaging fanned out
  over WebSocket through a pub/sub port (in-memory, Redis-ready); media through a storage port; a
  seeded world with a one-tap demo login and a demo-only reset so the shared demo is never stranded.
- **The AI intro, written server-side from the live graph.** A facts-only prompt, a plausibility
  guard, and a live → cached → baked → composed fallback ladder, so it never breaks and never lies.
- **One React Native source** for iOS and web, with the design handoffs restored: semantic haptics,
  slide-to-accept, the guest side of Trust, the Loop glyph set carrying the real logo, and layouts
  verified from 320px up.
- **Your own facts are editable**, and overlaps ("you both climb at Blok Shoreditch") update on both
  sides at once.
- CI (the badge above), a written [threat model](./THREAT_MODEL.md), and clean ports for voice,
  storage, pub/sub and the model so the next team can swap pieces without a rewrite.

## About the corpus

Kiki's real ~10k-conversation corpus is **not here**, and nothing in this repo has touched it.
`@kiki/voice` is the port it would plug into — to shape the AI's voice and style only, never as
training data or content — and it ships as a documented stub.
See [`packages/voice/VOICE_PIPELINE.md`](./packages/voice/VOICE_PIPELINE.md).
