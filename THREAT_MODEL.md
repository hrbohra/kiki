# Kiki — threat model

Scope: the `apps/api` backend (NestJS + Prisma + tRPC on Postgres) and its data. Written for the
real-user-readiness bar; revisit before onboarding real users at scale.

## Assets
- Member trust graph (vouches, overlaps) and PII (names, emails).
- User accounts + sessions (JWT access, refresh tokens).
- Messages between members.
- Secrets: DB URLs, JWT secrets, Gemini key, Resend key, blob token.
- Kiki's ~10k-conversation corpus is **not in this repo or any system here**. `@kiki/voice` is the port it would plug into (voice/style only); if it were ever loaded, it would be isolated from the app DB and anonymised.

## Trust boundaries
Client ⇄ API (tRPC HTTP + WS) · API ⇄ Postgres · API ⇄ third parties (Gemini, Resend, Blob).

## Threats & mitigations (STRIDE-ish)

| Threat | Mitigation (status) |
|---|---|
| **Spoofing** — forged identity | Passwordless email OTP (hashed, attempt-limited, 10-min TTL); JWT access (15m) signed server-side; WS auth via `connectionParams.token`. ✅ |
| **Unauthorized signup** | Invite-gated: no account without a valid, unclaimed invite code. Invite tree recorded. ✅ |
| **Tampering** — acting as another member | Every write is user-scoped via `actingMemberId`; host-only guards on decide/listing-photo; thread participant checks. ✅ |
| **Repudiation** | Immutable-ish audit trails (createdAt, decidedAt, invite claim, refresh-token family). Consider a dedicated event log for real scale. ⚠️ partial |
| **Information disclosure** | Refresh tokens + OTPs stored **hashed** (sha256); secrets only in gitignored `.env` / platform env, never client bundle; Gemini/Blob keys server-side; CORS enabled. ✅ |
| **Repeated/leaked refresh token** | Rotation + **family-wide reuse detection**: replaying a rotated token revokes the whole session family. ✅ |
| **DoS / abuse** | Fixed-window rate limit on OTP requests (5 / 15 min / email). Extend to other mutations + a WAF/edge limit for production; back the limiter with Redis for multi-instance. ⚠️ partial |
| **Injection** | Prisma parameterised queries (no raw SQL); all tRPC inputs Zod-validated. ✅ |
| **Malicious uploads** | Image-only + size cap (8 MB); re-encoded via sharp (strips most payloads); stored under a per-user path. Add AV scanning + content sniffing for production. ⚠️ partial |
| **LLM prompt/style injection & bad output** | Content prompt is facts-only from the graph; a plausibility guard rejects (and never caches) model output that leaks reasoning/meta or refuses. Corpus is voice-only, anonymised. ✅ |
| **Elevation of privilege** | No role escalation paths; member actions gated by ownership; admin surfaces not exposed via the public API. ✅ |

## Known gaps / next
- Idempotency + rate limits are per-instance (in-memory) — move to Redis before horizontal scaling.
- Add structured audit logging + Sentry (guarded init wired; set `SENTRY_DSN`).
- Per-viewer authorization on reads (currently the demo viewer) once onboarding maps users→members.
- Secret rotation runbook; least-privilege DB roles for app vs migrations.
- Real-data staging: import only anonymised data; never mix real user data into the public demo.
