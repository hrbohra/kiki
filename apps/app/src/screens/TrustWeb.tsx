import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, StyleSheet } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Loop } from '../ui/Loop';
import { CountPill } from '../ui/trust/CountPill';
import { Disclosure } from '../ui/trust/Disclosure';
import { VouchCard } from '../ui/trust/VouchCard';
import { TieMeter } from '../ui/trust/TieMeter';
import { ConnectionRings } from '../ui/trust/ConnectionRings';
import { photoFor } from '../ui/listingPhotos';
import { relRange } from '../domain/relDates';
import { stayLength } from '../domain/stay';
import { draftOptions, type DraftKind } from '@kiki/domain';
import { MutualFriendIntro } from '../ui/MutualFriendIntro';
import { GuestColumn } from './web/GuestColumn';
import { GraphModal } from './web/GraphModal';
import { color, radius } from '../theme/tokens';
import * as world from '../world';
import type { RootNav } from '../navigation';
import type { Overlap, TrustStory } from '../domain/types';

type P = 'host' | 'guest';
const sticky = (top: number) => ({ position: 'sticky', top } as any);
const CARD_SHADOW = { shadowColor: '#1A1A1A', shadowOpacity: 0.05, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 2 };

/**
 * Desktop web layout for the Trust tab — all three states (warm / direct / cold). The left
 * rail (person, actions, what-we-don't-know) is shared and never scrolls away; the centre
 * column changes with the state. Warm keeps the desktop-only cross-highlighting between the
 * vouch cards and the graph.
 */
export function TrustWeb({ hostId, navigation, embedded, perspective: extPerspective, onPerspective, reader }: { hostId: string; navigation: RootNav; embedded?: boolean; perspective?: P; onPerspective?: (p: P) => void; /** who is reading: drives the rail copy + CTA; the facet toggle drives the centre column */ reader?: P }) {
  const story = world.trustStoryFor(hostId);
  const host = story.host;
  const viewer = world.memberById(world.viewerId);
  const listing = world.listingForHost(hostId);
  const guestBook = world.guestBookOf(hostId);

  // When embedded in PersonView the host/guest toggle lives in that shell; standalone we own it.
  const [perspInternal, setPerspInternal] = useState<P>('host');
  const perspective = extPerspective ?? perspInternal;
  const setPerspective = onPerspective ?? setPerspInternal;
  const [inferOpen, setInferOpen] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const notify = (m: string) => { setToast(m); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 1800); };

  const names = story.channels.map((ch) => ch.voucher.name);
  const req = story.warm
    ? { dates: relRange(4, 28), nights: 28 }
    : { dates: relRange(18, 14), nights: 14 };
  const c = copy(reader ?? perspective, host.name, { voucher: names[0], nights: req.nights, warm: story.warm, direct: story.direct });

  return (
    <View style={styles.page}>
      {embedded ? null : (
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.wordmark}><Loop size={30} color={color.brand} opacity={1} strokeWidth={9} /><Text style={styles.brandName}>Kiki</Text></View>
          <View style={styles.tabs}>
            <WebTab label="Room" onPress={() => navigation.goBack()} />
            <WebTab label="Profile" onPress={() => navigation.goBack()} />
            <WebTab label="Trust" active />
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.perspSwitch}>
            {(['host', 'guest'] as P[]).map((p) => (
              <Pressable key={p} onPress={() => setPerspective(p)} style={[styles.perspBtn, perspective === p && styles.perspActive]}>
                <Text style={[styles.perspText, perspective === p && styles.perspTextActive]}>{p === 'host' ? 'The host' : 'The guest'}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          {/* Rail */}
          <View style={[styles.rail, sticky(24)]}>
            <View style={[styles.card, styles.railCard]}>
              <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={88} />
              <Text style={styles.name}>{host.name}</Text>
              <Text style={styles.role}>{c.emmaRole}</Text>
              <View style={styles.datePill}><Text style={styles.datePillText}>{req.dates}</Text></View>
              <Text style={styles.headline}>{c.headline}</Text>
              <Text style={styles.stakes}>{c.stakeLine}</Text>
            </View>
            <View style={[styles.card, styles.railCard]}>
              {toast ? <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View> : null}
              {names[0] ? (
                <Pressable style={({ pressed }) => [styles.secondary, pressed && { transform: [{ scale: 0.99 }] }]} onPress={() => navigation.navigate('Thread', { memberId: story.channels[0].voucher.id })}>
                  <Text style={styles.secondaryText}>Ask {names[0]} about {host.name}</Text>
                  <Text style={styles.secondarySub}>she's hosted for you before</Text>
                </Pressable>
              ) : null}
              <View style={styles.primaryRow}>
                <View>
                  <Text style={styles.primaryName}>{host.name} · {stayLength(req.nights)}</Text>
                  <Text style={styles.primaryPrice}>£{listing?.pricePerNight ?? 0} / night</Text>
                </View>
                <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { transform: [{ scale: 0.98 }] }]} onPress={() => { const l = world.listingForHost(hostId); if (l && (reader ?? perspective) === 'guest') navigation.navigate('RequestStay', { listingId: l.id }); else navigation.navigate('Thread', { memberId: hostId }); }}>
                  <Text style={styles.primaryBtnText}>{c.ctaLabel}</Text>
                </Pressable>
              </View>
              <Text style={styles.deciding}>Deciding later is a real option.</Text>
              {story.consentNames.length ? (
                <View style={styles.consent}>
                  <Avatar id={story.channels[0].voucher.id} name={names[0]} tint={story.channels[0].voucher.avatarColor} size={24} />
                  <Text style={styles.consentText}>{story.consentNames.join(' and ')} both said yes to being shown here</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.card, styles.gapCard]}>
              <View style={styles.caveatStrip} />
              <Text style={styles.gapHeading}>What we don't know</Text>
              {gapRows(story, c).map((r, i) => <Text key={i} style={styles.gapRow}>{r}</Text>)}
            </View>
          </View>

          {/* Centre — the guest side is a different question, so it replaces the whole column */}
          <View style={styles.center}>
            {perspective === 'guest' ? (
              <>
                <GuestColumn hostId={hostId} onBackToHost={() => setPerspective('host')} />
                {!story.warm && !story.direct ? (
                  <NextStepsWeb
                    options={draftOptions(reader ?? 'guest', req.nights)}
                    onDraft={(kind: DraftKind) => navigation.navigate('Thread', { memberId: hostId, draft: { kind, as: reader ?? 'guest', nights: req.nights } })}
                  />
                ) : null}
              </>
            ) : (
              <>
                <MutualFriendIntro hostId={hostId} />
                {story.warm ? (
                  <WarmCenter story={story} host={host} viewer={viewer} listing={listing} guestBook={guestBook} c={c} inferOpen={inferOpen} setInferOpen={setInferOpen} notify={notify} />
                ) : story.direct ? (
                  <DirectCenter story={story} host={host} listing={listing} guestBook={guestBook} c={c} inferOpen={inferOpen} setInferOpen={setInferOpen} onRoute={() => setRouteOpen(true)} />
                ) : (
                  <ColdCenter
                    story={story} host={host}
                    options={draftOptions(reader ?? perspective, req.nights)}
                    onDraft={(kind: DraftKind) => navigation.navigate('Thread', { memberId: hostId, draft: { kind, as: reader ?? perspective, nights: req.nights } })}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
      {routeOpen ? <GraphModal hostId={hostId} onClose={() => setRouteOpen(false)} /> : null}
    </View>
  );
}

// ---- WARM ------------------------------------------------------------------
function WarmCenter({ story, host, viewer, listing, guestBook, c, inferOpen, setInferOpen, notify }: any) {
  const [hovered, setHovered] = useState<number | null>(null);
  const names = story.channels.map((ch: any) => ch.voucher.name);
  const graphCaption =
    hovered == null
      ? `Each ring is one step away from you. ${host.name} sits two steps out, and you reach them two different ways.`
      : hovered === 0
        ? `${names[0]}'s route — thick because ${story.channels[0].tie.reason.toLowerCase().replace(/\.$/, '')}, and solid because she wrote something.`
        : `${names[1]}'s route — thin because one shared event is all you have, and dashed because she wrote nothing.`;
  const infer = inferences(story.overlaps);

  return (
    <>
      <View style={[styles.card, styles.digest]}>
        <DigestCell label="Vouched for by" value={names.join(' and ')} note={`${story.channels.length} independent routes`} />
        <DigestCell label="Guest book" value={`${guestBook.summary.count} entries`} note="from people you know" />
        <DigestCell label="Times hosted" value={`${guestBook.summary.count}`} note="Never stayed anywhere" />
        <DigestCell label="On Kiki since" value="Jul 2025" note="13 months" />
        <Text style={styles.digestFoot}>Counts only. We won't add these up into a score for you.</Text>
      </View>

      <TrackRecord host={host} listing={listing} guestBook={guestBook} c={c} notify={notify} />

      <View style={styles.band}>
        <Text style={styles.bandHeading}>The people behind {host.name}</Text>
        <Text style={styles.bandSub}>Point at a card to see where that person sits around you.</Text>
        <View style={styles.people}>
          <View style={styles.vouchCol}>
            {story.channels.map((ch: any, i: number) => (
              <Pressable key={ch.voucher.id} onHoverIn={() => setHovered(i)} onHoverOut={() => setHovered(null)} style={{ opacity: hovered == null || hovered === i ? 1 : 0.55 }}>
                <VouchCard channel={ch} hostName={host.name} />
              </Pressable>
            ))}
            <VouchCard ops={{ label: 'Founding Kikier', body: `We met ${host.name} for coffee before we launched in London. One of the first hundred!`, source: 'From us, Jul 2025' }} />
          </View>
          <View style={[styles.graphPanel, sticky(24)]}>
            <View style={styles.graphHead}><Text style={styles.graphTitle}>Where they sit around you</Text><CountPill label={`${story.channels.length} mutuals`} onPress={() => notify('Mutuals')} /></View>
            <ConnectionRings viewer={viewer} host={host} channels={story.channels} highlight={hovered} onHover={setHovered} />
            <Text style={styles.graphCaption}>{graphCaption}</Text>
          </View>
        </View>
      </View>

      {infer.length ? <InferenceBand infer={infer} open={inferOpen} setOpen={setInferOpen} /> : null}
    </>
  );
}

// ---- DIRECT ----------------------------------------------------------------
function DirectCenter({ story, host, listing, guestBook, c, inferOpen, setInferOpen, onRoute }: any) {
  const infer = inferences(story.overlaps);
  return (
    <>
      <View style={styles.band}>
        <Text style={styles.bandHeading}>How you know {host.name}</Text>
        <View style={styles.directCard}>
          <View style={styles.strip} />
          <View style={styles.directHead}>
            <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={56} />
            <View style={styles.directBadge}><Loop size={16} color="#FFFFFF" opacity={1} strokeWidth={10} /></View>
            <Text style={styles.directLabel}>You're directly connected</Text>
          </View>
          <Text style={styles.directBody}>You don't need a mutual to vouch for {host.name} — you know them yourself. That's the strongest link Kiki can show you.</Text>
          <View style={styles.directRoute}>
            <Text style={styles.directRouteText}>{story.directLink?.note ?? 'A direct connection of yours.'}</Text>
            {story.directLink ? <TieMeter strength={story.directLink.tie.strength} /> : null}
          </View>
          <Pressable onPress={onRoute} hitSlop={8} accessibilityRole="button"><Text style={styles.seeRoute}>See the route ›</Text></Pressable>
        </View>
      </View>
      <TrackRecord host={host} listing={listing} guestBook={guestBook} c={c} notify={() => {}} />
      {infer.length ? <InferenceBand infer={infer} open={inferOpen} setOpen={setInferOpen} /> : null}
    </>
  );
}

// ---- COLD ------------------------------------------------------------------
function ColdCenter({ story, host, options, onDraft }: any) {
  const g = story.guestTrackRecord[0];
  return (
    <>
      <View style={[styles.card, styles.coldEmpty]}>
        <View style={styles.brokenLoop}><Loop size={40} color={color.brokenLoop} opacity={1} strokeWidth={8} /></View>
        <Text style={styles.coldTitle}>You two don't have anyone in common yet.</Text>
        <Text style={styles.coldBody}>We're not going to dress that up. Nobody you know can tell you anything about {host.name}, so here's everything we do have instead.</Text>
      </View>

      {story.inviter ? (
        <View style={styles.band}>
          <Text style={styles.bandHeading}>How they got in</Text>
          <VouchCard
            channel={{ voucher: story.inviter.member, note: `${story.inviter.member.name} invited them into Kiki`, tie: { strength: 1, reason: `${story.inviter.member.name} is ${story.inviter.degrees} steps from you — far enough not to count.` } }}
            hostName={host.name}
          />
        </View>
      ) : null}

      <View style={styles.band}>
        <Text style={styles.bandHeading}>Their track record</Text>
        <View style={[styles.card, { padding: 20, gap: 12 }]}>
          <Text style={styles.claim}>They've stayed with {story.guestTrackRecord.length} people. {story.guestTrackRecord.length ? 'Both wrote them a good entry.' : ''}</Text>
          {g ? (
            <View style={styles.coldQuote}>
              <Text style={styles.coldQuoteText}>“{g.text}”</Text>
              <Text style={styles.coldCite}>{g.author.name}, who you don't know</Text>
            </View>
          ) : null}
          <Text style={styles.reading}>Two strangers saying good things is worth less than one friend saying it. It still isn't nothing.</Text>
        </View>
      </View>

      <NextStepsWeb options={options} onDraft={onDraft} />
    </>
  );
}

/** "You don't have to decide on this today" — see NextSteps in TrustScreen. */
function NextStepsWeb({ options, onDraft }: { options: { kind: DraftKind; label: string }[]; onDraft: (kind: DraftKind) => void }) {
  return (
    <View style={styles.band}>
      <View style={styles.nextCard}>
        <Text style={styles.nextTitle}>You don't have to decide on this today</Text>
        <Text style={styles.nextLead}>Plenty of good matches start out cold. A few things that help:</Text>
        {options.map((o) => (
          <Pressable key={o.kind} style={({ pressed }) => [styles.nextRow, pressed && { transform: [{ scale: 0.99 }] }]} onPress={() => onDraft(o.kind)} accessibilityRole="button" accessibilityHint="Kiki drafts the message; you edit and send it">
            <Text style={styles.nextRowText}>{o.label} ›</Text>
          </Pressable>
        ))}
        <Text style={{ fontSize: 12.5, lineHeight: 18, color: color.inkFaint, marginTop: 6 }}>Kiki drafts the message from what it can prove about you both. You read it, change it, and send it yourself.</Text>
      </View>
    </View>
  );
}

// ---- shared bits -----------------------------------------------------------
function TrackRecord({ host, listing, guestBook, c, notify }: any) {
  return (
    <View style={styles.band}>
      <Text style={styles.bandHeading}>Their track record</Text>
      <View style={styles.split}>
        <View style={[styles.card, styles.placeCard]}>
          <Image source={listing ? photoFor(listing.id) : undefined} style={styles.placePhoto} resizeMode="cover" />
          <View style={styles.placeBody}>
            <Text style={styles.placeTitle}>{host.name}'s place in {listing?.area?.split(',')[0]}</Text>
            <Text style={styles.placeCaption}>{c.placeCaption}</Text>
          </View>
        </View>
        <View style={[styles.card, styles.gbCard]}>
          <Text style={styles.claim}>{guestBook.summary.count} of {guestBook.summary.count} people in their guest book are people you know</Text>
          <Text style={styles.reading}>{c.reviewRead}</Text>
          {guestBook.summary.highlight ? <View style={styles.quote}><Text style={styles.quoteText}>“{guestBook.summary.highlight}”</Text></View> : null}
          <View style={styles.pillRow}>
            <CountPill label={`${guestBook.summary.count} guest book entries`} onPress={() => notify('Guest book')} />
            <CountPill label="1 past match" onPress={() => notify('Past match')} />
          </View>
        </View>
      </View>
    </View>
  );
}

function InferenceBand({ infer, open, setOpen }: { infer: { claim: string; source: string }[]; open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <View style={styles.band}>
      <Text style={styles.bandHeading}>What we think, and what we don't know</Text>
      <Text style={styles.bandSub}>Nobody stated any of this. We worked it out.</Text>
      <View style={styles.dashedCard}>
        <Disclosure open={open} onToggle={() => setOpen(!open)} title={`${infer.length} thing${infer.length === 1 ? '' : 's'} we spotted about you two`} subtitle="None of this came from a person. Here's how we worked it out." chevron="plusminus">
          {infer.map((it, i) => (
            <View key={i} style={[styles.inferRow, i > 0 && styles.inferDivider]}>
              <Text style={styles.inferClaim}>{it.claim}</Text>
              <Text style={styles.inferSource}>{it.source}</Text>
            </View>
          ))}
        </Disclosure>
      </View>
    </View>
  );
}

function WebTab({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress} accessibilityRole="button"><Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text></Pressable>;
}
function DigestCell({ label, value, note }: { label: string; value: string; note: string }) {
  return <View style={styles.digestCell}><Text style={styles.digestLabel}>{label}</Text><Text style={styles.digestValue} numberOfLines={1}>{value}</Text><Text style={styles.digestNote}>{note}</Text></View>;
}
function inferences(overlaps: Overlap[]) {
  const src: Record<string, string> = { inferred: 'From our own event list. You might have met.', self_declared: "You both typed that yourselves. We haven't checked it.", matched: 'An exact match on file.' };
  const textSrc = { bio: 'Read out of your bios. Your own words; we only matched the topic.', guest_book: 'Read out of the guest book. We worked it out from what guests wrote.' } as const;
  return overlaps.filter((o) => o.kind === 'origin' || o.kind === 'education' || o.kind === 'event').map((o) => ({ claim: o.label, source: o.source === 'bio' || o.source === 'guest_book' ? textSrc[o.source] : src[o.provenance] }));
}
function gapRows(story: TrustStory, c: { gapRole: string }): string[] {
  const host = story.host.name;
  if (story.warm) return [`Nobody you know has actually had ${host} stay with them.`, c.gapRole];
  if (story.direct) return [`You know ${host} directly, but nobody in your circle has hosted them.`, c.gapRole];
  return [`You've never met ${host}.`, `Nobody in your circle has been in a room with them.`, `They've been on Kiki six weeks, so the record is thin either way.`];
}
function copy(p: P, host: string, o: { voucher?: string; nights: number; warm: boolean; direct: boolean }) {
  // Reassuring, not anxious: name the reason to trust, not the list of things at risk.
  const hostStake = o.warm && o.voucher
    ? `Because ${o.voucher} vouches for her, your keys, your kitchen and your bed are in good hands.`
    : o.direct
      ? `You know ${host} yourself, so your place is in good hands.`
      : `You two don't know each other yet — here's everything we do have, and what we don't.`;
  const guestStake = o.warm && o.voucher
    ? `${o.voucher} vouches for her, and people you know have already stayed — you're in good hands.`
    : o.direct
      ? `You already know ${host}, so this is familiar ground.`
      : `You're new to each other — here's everything we have, and what we can't answer.`;

  if (p === 'host') {
    return {
      emmaRole: 'Hoping to stay with you', ctaLabel: 'Reply',
      headline: `${host} is taking over your space for ${stayLength(o.nights)}.`,
      stakeLine: hostStake,
      placeCaption: `This is the flat ${host} keeps herself — the closest thing to a preview of how she'll keep yours.`,
      reviewRead: `Every review talks about ${host} as a host. Not one is from someone who had her as a guest, which is what you'd be doing.`,
      gapRole: `${host} has hosted before but has never been a guest on Kiki, so nobody has written about how she treats someone else's home.`,
    };
  }
  return {
    emmaRole: 'Opening up their place', ctaLabel: 'Request to book',
    headline: `You'd have ${host}'s place to yourself for ${stayLength(o.nights)}.`,
    stakeLine: guestStake,
    placeCaption: `This is the room you'd be sleeping in. People you know have already slept in it.`,
    reviewRead: `Every one of these is about staying in her place, which is exactly what you're about to do.`,
    gapRole: `Every account of ${host}'s home is from someone who stayed. If your situation is different, none of it is about you.`,
  };
}

const styles = StyleSheet.create({
  seeRoute: { fontSize: 13.5, fontWeight: '700', color: color.brand, marginTop: 6 },
  page: { flex: 1, backgroundColor: color.screen },
  header: { height: 68, backgroundColor: 'rgba(255,255,255,0.94)', borderBottomWidth: 1, borderBottomColor: color.hairline, ...(sticky(0)), zIndex: 20 },
  headerInner: { flex: 1, maxWidth: 1440, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 28, paddingHorizontal: 40 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  tabs: { flexDirection: 'row', height: '100%' },
  tab: { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: color.ink },
  tabText: { fontSize: 15, fontWeight: '600', color: color.inkFaint },
  tabTextActive: { fontWeight: '700', color: color.ink },
  perspSwitch: { flexDirection: 'row', borderWidth: 1, borderColor: color.hairline, borderRadius: radius.pill, padding: 3, backgroundColor: color.surface },
  perspBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  perspActive: { backgroundColor: color.bg },
  perspText: { fontSize: 13, fontWeight: '600', color: color.inkSoft },
  perspTextActive: { color: color.ink, fontWeight: '700' },
  scroll: { paddingBottom: 80 },
  shell: { maxWidth: 1440, width: '100%', alignSelf: 'center', paddingHorizontal: 40, paddingTop: 36, flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  rail: { width: 376, gap: 16 },
  center: { flex: 1, gap: 40 },
  card: { backgroundColor: color.surface, borderRadius: 20, ...CARD_SHADOW },
  railCard: { borderRadius: 20, padding: 24, gap: 12, alignItems: 'flex-start' },
  name: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6, color: color.ink, marginTop: 6 },
  role: { fontSize: 14, color: color.inkSoft },
  datePill: { backgroundColor: color.ink, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7, marginTop: 4 },
  datePillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 26, color: color.ink, marginTop: 6 },
  stakes: { fontSize: 14, lineHeight: 22, color: color.inkSoft },
  toast: { backgroundColor: color.ink, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, alignSelf: 'stretch' },
  toastText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '600' },
  secondary: { borderWidth: 1, borderColor: color.brand, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', gap: 2 },
  secondaryText: { fontSize: 15, fontWeight: '600', color: color.textOnMint },
  secondarySub: { fontSize: 12.5, color: color.textOnMintSoft },
  primaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  primaryName: { fontSize: 14, fontWeight: '600', color: color.ink },
  primaryPrice: { fontSize: 12.5, color: color.inkFaint },
  primaryBtn: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deciding: { fontSize: 12.5, color: color.inkFaint, alignSelf: 'center' },
  consent: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: color.hairlineSoft, paddingTop: 12, alignSelf: 'stretch' },
  consentText: { flex: 1, fontSize: 13, fontWeight: '600', color: color.textOnMint },
  gapCard: { borderRadius: 20, padding: 24, paddingLeft: 27, gap: 9, overflow: 'hidden' },
  caveatStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  gapHeading: { fontSize: 13.5, fontWeight: '700', color: color.caveat },
  gapRow: { fontSize: 15, lineHeight: 22, color: color.ink },
  digest: { flexDirection: 'row', flexWrap: 'wrap', padding: 22, paddingHorizontal: 24, gap: 24 },
  digestCell: { flexGrow: 1, flexBasis: 150, gap: 4 },
  digestLabel: { fontSize: 12.5, color: color.inkFaint },
  digestValue: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  digestNote: { fontSize: 12.5, color: color.inkFaint },
  digestFoot: { flexBasis: '100%', fontSize: 12.5, color: color.inkFaint, borderTopWidth: 1, borderTopColor: color.hairlineSoft, paddingTop: 12 },
  band: { gap: 16 },
  bandHeading: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  bandSub: { fontSize: 13.5, color: color.inkFaint, marginTop: -8 },
  split: { flexDirection: 'row', gap: 16, alignItems: 'stretch' },
  placeCard: { flex: 1, overflow: 'hidden', padding: 0 },
  placePhoto: { width: '100%', height: 184 },
  placeBody: { padding: 16, gap: 9 },
  placeTitle: { fontSize: 15, fontWeight: '700', color: color.ink },
  placeCaption: { fontSize: 13.5, lineHeight: 20, color: color.inkSoft },
  gbCard: { flex: 1.25, padding: 20, gap: 14 },
  claim: { fontSize: 16, fontWeight: '600', color: color.ink },
  reading: { fontSize: 13.5, lineHeight: 20, color: color.inkSoft },
  quote: { backgroundColor: color.screen, borderRadius: 12, padding: 14, paddingHorizontal: 16 },
  quoteText: { fontSize: 14.5, lineHeight: 21, color: color.ink },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  people: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  vouchCol: { flex: 1, minWidth: 340, gap: 16 },
  graphPanel: { width: 380, backgroundColor: color.surface, borderRadius: 20, padding: 20, gap: 12, ...CARD_SHADOW },
  graphHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  graphTitle: { fontSize: 15, fontWeight: '700', color: color.ink },
  graphCaption: { fontSize: 13, lineHeight: 20, color: color.inkSoft },
  dashedCard: { backgroundColor: color.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D9D9D4', borderRadius: 20, paddingHorizontal: 20 },
  inferRow: { gap: 2, paddingVertical: 8 },
  inferDivider: { borderTopWidth: 1, borderTopColor: color.hairlineSoft },
  inferClaim: { fontSize: 15, lineHeight: 21, color: color.ink },
  inferSource: { fontSize: 12.5, color: color.inkFaint },
  // direct
  directCard: { backgroundColor: color.brandTint, borderRadius: 20, padding: 20, paddingLeft: 23, gap: 12, overflow: 'hidden' },
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.brand },
  directHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  directBadge: { position: 'absolute', left: 0, bottom: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  directLabel: { flex: 1, fontSize: 15.5, fontWeight: '700', color: color.textOnMint },
  directBody: { fontSize: 14, lineHeight: 21, color: color.textOnMintSoft },
  directRoute: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: color.hairlineTint, paddingTop: 10 },
  directRouteText: { flex: 1, fontSize: 13, color: color.textOnMintSoft },
  // cold
  coldEmpty: { padding: 24, gap: 10, alignItems: 'flex-start' },
  brokenLoop: { width: 38, height: 38, borderRadius: 19, backgroundColor: color.screen, alignItems: 'center', justifyContent: 'center' },
  coldTitle: { fontSize: 18, fontWeight: '700', color: color.ink },
  coldBody: { fontSize: 14, lineHeight: 21, color: color.inkSoft },
  coldQuote: { backgroundColor: color.screen, borderRadius: 12, padding: 14, paddingHorizontal: 16 },
  coldQuoteText: { fontSize: 14.5, lineHeight: 21, color: color.ink },
  coldCite: { fontSize: 12.5, color: color.inkSoft, marginTop: 6 },
  nextCard: { backgroundColor: color.brandTint, borderRadius: 20, padding: 20, gap: 10 },
  nextTitle: { fontSize: 15.5, fontWeight: '700', color: color.textOnMint },
  nextLead: { fontSize: 14, color: color.ink },
  nextRow: { backgroundColor: color.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  nextRowText: { fontSize: 14, fontWeight: '600', color: color.textOnMint },
});
