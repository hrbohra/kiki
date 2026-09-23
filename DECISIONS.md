# Decisions

Every decision in this repo written the same way: the premise it follows from, the obvious build it
replaces, why that build breaks the premise, what was done instead, and where to see it. The order is
the order the decisions were made. The design record at
https://kiki-portfolio-one.vercel.app/design shows the same decisions with screens and diagrams.

The premise, stated once: **the person comes first and the room is a consequence; the only currency
is who will put their name next to yours.** Kiki's own words say it as "your mutual friend in the
city". Every entry below is a consequence of that sentence or a measurement that tested it.

---

## Product

### 1. Rank homes by degrees of separation, never by price
- **Obvious build:** sort by price or by date, like every marketplace, with a "friends of friends" filter on the side.
- **Why it breaks the premise:** a cheaper stranger is still a stranger. Price answers a question Kiki is not asking, and putting it first tells the member that Kiki is a booking site with a trust feature.
- **Done instead:** degrees of separation are the ranking; the price is a detail on the card. The Explore feed is sorted by the domain's `degreeOf`, server-side and client-side alike.
- **Proof:** Explore, "You know Danica directly · 1st degree" sits above the price. `apps/api/src/trpc/routers/listings.router.ts`; the integration test "sorts the Explore feed by degree of separation, closest first".

### 2. The trust page is the product, not a rating
- **Obvious build:** star ratings and a review count, with a bio underneath.
- **Why it breaks the premise:** a rating is what strangers say about a stranger. Kiki's whole claim is that you are not strangers, so the page has to show the people between you, what they actually did together, and what Kiki cannot tell you.
- **Done instead:** a paragraph a mutual friend could have written, every claim labelled by where it came from, the routes between you drawn, and a plain "what Kiki cannot say" line when the evidence runs out.
- **Proof:** any host → Trust. `packages/domain/src/world.ts` (`trustStoryFor`), `apps/app/src/screens/TrustScreen.tsx`.

### 3. A host side and a guest side to every trust page
- **Obvious build:** one review stream per person.
- **Why it breaks the premise:** hosting reviews describe how someone keeps their own flat, not how they treat yours. One stream lets a great host pass as a great guest on evidence that never tested that.
- **Done instead:** guest evidence (`GuestReview`) is kept apart from host evidence, the page has a guest tab, and when there is no guest evidence it says so rather than padding the page.
- **Proof:** Requests → "Read their trust page" → "As a guest". `packages/domain/src/domain/guestRecords.ts`.

### 4. Mint means one thing
- **Obvious build:** the brand colour wherever a screen wants attention.
- **Why it breaks the premise:** the one thing the eye must be able to trust on sight is who can vouch. If mint also means "new" or "selected", that signal is gone.
- **Done instead:** mint only ever means "someone can vouch"; a third-degree pill never borrows it; gold means standing, rust means cost.
- **Proof:** `apps/app/src/theme/tokens.ts`, `apps/app/src/ui/TrustPill.tsx`; the design system chapter of the record.

### 5. No timers on requests
- **Obvious build:** a 24-hour countdown to lift acceptance rates.
- **Why it breaks the premise:** the product is the host's judgement of a person, and pressure is the one thing that makes judgement worse. A countdown turns a yes into a reflex.
- **Done instead:** nothing counts down. Requests carry the evidence and wait.
- **Proof:** Requests, nothing counts down. `packages/domain/src/domain/requests.ts`.

### 6. Show what a vouch costs
- **Obvious build:** hide the cost of vouching to lift sign-ups.
- **Why it breaks the premise:** a vouch nobody paid for is worth nothing to the person reading it. People vouch more carefully when they can see the bill, and careful vouches are the currency.
- **Done instead:** "What this costs you" is the third onboarding step, and "What Kiki carries" is said in the same breath, in one card grammar. Every string lives in one file so Kiki can set the wording.
- **Proof:** onboarding steps three and four. `apps/app/src/screens/OnboardScreen.tsx`, `apps/app/src/domain/covers.ts`.

### 7. Partial-cover offers
- **Obvious build:** a request either covers the whole absence or it is rejected.
- **Why it breaks the premise:** a sublet that covers most of the rent beats no sublet at all, and the person who can take five of your six weeks is still a person you trust.
- **Done instead:** a Kikier can offer part of a trip; the host sees what is covered and what is not.
- **Proof:** Trips → "Italy for Mum's 60th". `packages/domain/src/domain/trips.ts`, `apps/app/src/screens/TripOffersScreen.tsx`.

### 8. The match moment gets a screen
- **Obvious build:** a toast, "Request accepted", and back to the list.
- **Why it breaks the premise:** the yes is the emotional peak of the product, the moment two people stop being two or three steps apart. A toast treats it as a status change.
- **Done instead:** slide-to-match with rising resistance so the yes takes intent, a held screen with a drawn line between the two people, haptics only there, and the first thing said about Kiki's side is "You do nothing."
- **Proof:** Requests → slide to match. `apps/app/src/ui/SlideToAccept.tsx`, `apps/app/src/screens/MatchedScreen.tsx`.

### 9. "Ask Nina": the graph's own action
- **Obvious build:** a "Message host" button on every card.
- **Why it breaks the premise:** on a route of two or more steps the host is a stranger and the mutual is not. Messaging the host first skips the one person who can actually vouch.
- **Done instead:** on routes of two or more steps the button asks the mutual first. That message is how a graph learns.
- **Proof:** any host → Trust → "See the route". `apps/app/src/screens/ConnectionScreen.tsx`.

### 10. Who you brought in, as words not ranks
- **Obvious build:** a leaderboard of top inviters.
- **Why it breaks the premise:** a rank turns vouching into a competition, and competitive vouching is careless vouching (see 6).
- **Done instead:** your branch of the invite tree is visible with what each person has done since; tiers read as words; nobody is ranked.
- **Proof:** Community. `packages/domain/src/domain/invite.ts`, `packages/domain/src/pipeline/tiering.ts`.

---

## Measurement

### 11. Generate a 5,000-member world before designing the graph screens
- **Obvious build:** design against the 14-member demo world, where "two steps from you" is the normal case.
- **Why it breaks the premise:** the premise only holds if there is a route. At club scale I did not know how often there is one, and neither did the demo.
- **Done instead:** a deterministic generator grows an invite tree from a founder's first hundred coffees, events, friendships and completed matches, and measures reach from random members. Median degree 5; about 1% of the club within two steps; 6–7% at three; nearly two-thirds five or more away; roughly a dozen of 819 hosts within two steps.
- **Consequences:** three steps became the working unit for copy and drawing; similarity from bios and guest books entered the product (12); the imported-ties table shows a contacts step is worth more than any ranking work. A test pins the shape so a friendlier generator fails CI.
- **Proof:** `packages/domain/src/seedWorld.ts`, `packages/domain/src/__tests__/seedWorld.test.ts`, `apps/api/import/measure-imported-ties.ts`; the system chapter of the record.

### 12. Similarity reads bios and guest books, and labels its sources
- **Obvious build:** match on typed profile facts only (same gym, same university).
- **Why it breaks the premise:** the seed world says the vouch graph alone cannot introduce most pairs. People say far more about themselves in a bio, and their guests say more again. Without that text, most trust pages would be empty.
- **Done instead:** two passes, strongest evidence first: exact typed facts, then canonical topics extracted from bios and guest-book entries. Every overlap carries its source, and the screen shows it. A signal is a claim about a topic, never about character; character stays in the guest book's own words.
- **Proof:** `packages/domain/src/domain/similarity.ts`, `packages/domain/src/pipeline/textSignals.ts`; Me → "+ Add a fact" updates both sides at once.

### 13. Tie strength is measured, and the number is never shown
- **Obvious build:** a trust score per person, displayed as a number or a percentage.
- **Why it breaks the premise:** a number invites arguing; a fact invites a phone call. Nobody vouches for someone because their score is 71.
- **Done instead:** a tie's weight is 2·stays + 1·shared events + 1.5·[invite] + 1·[friend], decayed with an 18-month half-life; routes rank by their weakest link, then their sum. The sentence that produced the weight and a three-bar meter are displayed; the number is not.
- **Proof:** `packages/domain/src/domain/ties.ts`, `packages/domain/src/domain/__tests__/ties.test.ts`; any route on a Trust page.

---

## Intelligence

### 14. The AI may only say what the graph proves
- **Obvious build:** hand the model both profiles and ask for a warm introduction.
- **Why it breaks the premise:** a mutual friend who invents things is worse than none. The first time the model embellishes, every introduction after it is suspect, and the product's whole claim is that the introduction is true.
- **Done instead:** one pure function turns the real overlaps, mutuals and vouch notes into a facts-only brief ("use only these, invent nothing"), member-written text is fenced as data, and a guard rejects links, markup, leaked instructions and any name the facts never mentioned.
- **Proof:** `packages/domain/src/domain/mutualFriendIntro.ts`, `packages/domain/src/ai/introTask.ts`. The guard caught the model introducing the subject of a vouch note instead of the host on its first live run.

### 15. One contract for every AI feature, and one runner
- **Obvious build:** each feature calls the model its own way, with its own fallback and its own error handling.
- **Why it breaks the premise:** honesty that depends on every feature remembering to be honest will not survive the third feature.
- **Done instead:** every feature is an `AiTask` (facts, prompt, guard, deterministic twin); the `AiRunner` is the only place a model is called and walks one ladder, live → cached → baked → composed, reporting which rung spoke. Adding a feature is writing a task.
- **Proof:** `packages/domain/src/ai/task.ts`, `apps/api/src/ai/ai-runner.service.ts`, `packages/domain/src/__tests__/aiTasks.test.ts`.

### 16. The AI proposes; a person sends
- **Obvious build:** let the assistant message on the member's behalf, because it is faster.
- **Why it breaks the premise:** the introduction's value is that a person stands behind it. An AI-sent message has no name next to it.
- **Done instead:** the intro is displayed; the three drafts for cold matches (introduce me properly, a quick call first, a shorter first stay) land in the compose box, composed instantly on the device from the same facts, upgraded to the live draft only if the person has not started typing, and always edited and sent by them.
- **Proof:** Requests → Priya → Trust → the last card. `packages/domain/src/ai/drafts.ts`, `apps/app/src/screens/ThreadScreen.tsx`.

### 17. Voice is a separate port, and the corpus shapes only the voice
- **Obvious build:** fine-tune on Kiki's 10,000 conversations and let the model speak.
- **Why it breaks the premise:** the conversations are about real people. Used as content, they leak; used as training data, they fix today's tone into tomorrow's model. Used as a style guide, they do exactly what Kiki wants: make the AI sound like Kiki.
- **Done instead:** a `VoiceProvider` port supplies the system-level tone, separate from every task; the corpus is not in this repo and nothing here has touched it; the pipeline that would derive a voice pack is documented with one hard rule.
- **Proof:** `packages/voice/VOICE_PIPELINE.md`, `apps/api/src/ai/voice.provider.ts`.

---

## System

### 18. Business logic lives in one pure package
- **Obvious build:** compute trust on the server and ship the app a JSON of results; or compute on the client and trust it.
- **Why it breaks the premise:** two implementations of "who is two steps from whom" will disagree, and the disagreement will be found by a member.
- **Done instead:** `@kiki/domain` is pure and shared verbatim; the API and both apps import it; the app renders from a snapshot through the same selectors the server uses. 75 unit tests, no IO.
- **Proof:** `packages/domain`, `apps/app/src/world.ts`, `apps/api/src/world/world.service.ts`.

### 19. The API contract is a build artefact
- **Obvious build:** REST with hand-written client types.
- **Why it breaks the premise:** nothing to do with trust between people; everything to do with trust between packages. Hand-written types drift, and the drift shows up as a blank screen.
- **Done instead:** tRPC; `apps/api/src/contract.ts` exports the router type only; `@kiki/api-client` is compiled against it; the app's call sites are typechecked in CI.
- **Proof:** `packages/api-client`, `pnpm typecheck`.

### 20. Invite-only, passwordless, rotating tokens
- **Obvious build:** email and password, or "sign in with Google".
- **Why it breaks the premise:** the invite is the vouch. Sign-up has to begin with a person, not a form, and a password is one more thing that is not evidence of anything.
- **Done instead:** invite code → OTP → short-lived access JWT plus a rotating refresh token; presenting a rotated token again revokes the whole family; the invite tree is recorded, because it is the graph's backbone.
- **Proof:** `apps/api/src/auth/auth.service.ts`, `apps/api/src/auth/tokens.ts`; the integration test "blocks signup without an invite code"; the threat model.

### 21. Persist, then publish
- **Obvious build:** push messages over the socket and write them down afterwards.
- **Why it breaks the premise:** a message that arrived on one device and not in the database is a conversation two people remember differently.
- **Done instead:** a message is written first, then published on a `MessageBus` port; WebSocket subscribers fan out from the bus; the socket is a cache of the database. In-memory bus for one instance, Redis binding ready for several.
- **Proof:** `apps/api/src/messaging/messaging.service.ts`, `apps/api/src/messaging/message-bus.ts`.

### 22. A shared demo that can never be stranded
- **Obvious build:** a demo account that everyone shares and slowly fills with junk.
- **Why it breaks the premise:** a reviewer who lands in someone else's test data cannot see the product.
- **Done instead:** one-tap demo login into a seeded world, a demo-only reset, an app session that never blocks on the network, a wake bar if the free-tier API is asleep, and a server that pings itself so it rarely is.
- **Proof:** `apps/api/src/trpc/routers/demo.router.ts`, `apps/app/src/screens/DemoEntry.tsx`, `apps/api/src/main.ts`.

### 23. Expo Go-safe everywhere, and one implementation for native and web
- **Obvious build:** the animated map in Skia, a dev-client build, and a separate web app.
- **Why it broke here:** built on a Windows PC with no Xcode, tested on an iPhone through Expo Go; Skia's web target cannot run in Expo Go and would force two implementations of every animated surface.
- **Done instead:** react-native-svg, a gradient and Reanimated for the map; every dependency Expo Go-safe; a react-native-web export so a reviewer needs no phone; the desktop layout is the same screens under a wide shell.
- **Proof:** `apps/app/src/ui/LivingMap.tsx`, `apps/app/src/ui/useResponsive.ts`, `apps/app/App.tsx`.

---

## What I would decide differently with Kiki's data

Recorded honestly, because a decisions log that only lists wins is a brochure.

- **Text signals should become embeddings once there is real text.** The lexicon in `textSignals.ts` is deterministic and testable, which was right for a demo with fourteen bios. On thousands of real bios it will miss most overlaps. The seam is already there: text in, canonical signals out.
- **The seed world's invite tree is a guess at Kiki's growth.** It was grown from the manifesto's numbers (a founder's first hundred coffees, 2,300 matches). Kiki's real tree will have a different degree distribution, and the first thing to do with real data is re-run `measure:ties` against it.
- **The imported-ties table argues for a contacts step before more ranking work.** That is a product bet made from a synthetic graph. It is the first thing I would want to check against the real one.
- **Render and Neon free tiers are a demo choice.** Kiki runs on AWS with Terraform; the ports above are the seams for that swap, and I would adopt Kiki's conventions rather than carry these over.
