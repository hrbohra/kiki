import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, StyleSheet, SafeAreaView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Loop } from '../ui/Loop';
import { CountPill } from '../ui/trust/CountPill';
import { Disclosure } from '../ui/trust/Disclosure';
import { VouchCard } from '../ui/trust/VouchCard';
import { TieMeter } from '../ui/trust/TieMeter';
import { ConnectionRings } from '../ui/trust/ConnectionRings';
import { photoFor } from '../ui/listingPhotos';
import { relRange } from '../domain/relDates';
import { useResponsive } from '../ui/useResponsive';
import { PersonView } from './web/PersonView';
import { color, radius } from '../theme/tokens';
import * as world from '../world';
import type { StackProps } from '../navigation';
import type { Overlap } from '../domain/types';

type P = 'host' | 'guest';

/** Trust tab — warm/cold/direct states. On a wide desktop browser the warm case switches to
 *  the two-column TrustWeb layout; everything narrower keeps this phone-first screen. */
export function TrustScreen({ route, navigation }: StackProps<'Trust'>) {
  const hostId = route.params.hostId;
  const story = world.trustStoryFor(hostId);
  const { isWide } = useResponsive();
  if (isWide) return <PersonView hostId={hostId} initialTab="trust" navigation={navigation} />;
  const host = story.host;
  const listing = world.listingForHost(hostId);
  const guestBook = world.guestBookOf(hostId);
  const viewer = world.memberById(world.viewerId);

  const [perspective, setPerspective] = useState<P>('host');
  const [whyOpen, setWhyOpen] = useState(false);
  const [inferOpen, setInferOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const notify = (msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 1800);
  };

  const names = story.channels.map((c) => c.voucher.name);
  const req = story.warm
    ? { dates: relRange(4, 7), nights: 7, asked: 'asked you 2 days ago' }
    : { dates: relRange(18, 3), nights: 3, asked: 'asked you 4 hours ago' };
  const c = copy(perspective, host.name, names, story.channels.length, guestBook.summary.count, story.direct);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Nav row */}
      <View style={styles.nav}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.saveHeart} accessibilityLabel="Save" accessibilityRole="button">♡</Text>
      </View>

      {/* Identity */}
      <View style={styles.identity}>
        <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={74} />
        <Text style={styles.name}>{host.name}</Text>
        <Text style={styles.sub}>{c.profileSub}</Text>
      </View>

      {/* Tab bar: Room · Profile · Trust */}
      <View style={styles.tabbar}>
        <ProfileTab label="Room" onPress={() => navigation.goBack()} />
        <ProfileTab label="Profile" onPress={() => navigation.goBack()} />
        <ProfileTab label="Trust" active />
        <View style={styles.indicator} />
      </View>

      {/* Perspective toggle (prototype-only; production derives this) */}
      <View style={styles.perspRow}>
        <Text style={styles.perspHint}>Reading as</Text>
        <View style={styles.segment}>
          {(['host', 'guest'] as P[]).map((p) => (
            <Pressable key={p} onPress={() => setPerspective(p)} style={[styles.segBtn, perspective === p && styles.segActive]}>
              <Text style={[styles.segText, perspective === p && styles.segTextActive]}>{p === 'host' ? 'The host' : 'The guest'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Request row */}
        <View style={styles.requestRow}>
          <View style={styles.datePill}><Text style={styles.datePillText}>{req.dates}</Text></View>
          <Text style={styles.timestamp}>{req.asked}</Text>
        </View>

        {story.warm || story.direct ? (
          <WarmBody
            story={story} host={host} viewer={viewer} listing={listing} guestBook={guestBook}
            copy={c} whyOpen={whyOpen} setWhyOpen={setWhyOpen} graphOpen={graphOpen} setGraphOpen={setGraphOpen}
            inferOpen={inferOpen} setInferOpen={setInferOpen} notify={notify}
          />
        ) : (
          <ColdBody story={story} host={host} copy={c} notify={notify} />
        )}
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        {toast ? (
          <View style={styles.toast} accessibilityRole="alert"><Text style={styles.toastText}>{toast}</Text></View>
        ) : null}
        {story.warm && names[0] ? (
          <Pressable style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]} onPress={() => notify(`Asked ${names[0]} about ${host.name}`)}>
            <Text style={styles.secondaryText}>Ask {names[0]} about {host.name}</Text>
            <Text style={styles.secondarySub}>{story.channels[0].tie.reason.replace(/\.$/, '')}</Text>
          </Pressable>
        ) : null}
        <View style={styles.primaryRow}>
          <View style={styles.primaryLeft}>
            <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={34} />
            <View>
              <Text style={styles.primaryName}>{host.name} · {req.nights} nights</Text>
              <Text style={styles.primaryPrice}>£{listing?.pricePerNight ?? 0} / night</Text>
            </View>
          </View>
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]} onPress={() => notify(`${c.ctaLabel} sent`)}>
            <Text style={styles.primaryBtnText}>{c.ctaLabel}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---- Warm body -------------------------------------------------------------
function WarmBody({ story, host, viewer, listing, guestBook, copy: c, whyOpen, setWhyOpen, graphOpen, setGraphOpen, inferOpen, setInferOpen, notify }: any) {
  const authors = guestBook.reviews.slice(0, 3).map((r: any) => world.memberById(r.authorId));
  const knownCount = guestBook.reviews.filter((r: any) => Number.isFinite(world.degreeToHost(r.authorId)) && world.degreeToHost(r.authorId) <= 2).length;
  const inferItems = selectInferences(story.overlaps);

  return (
    <>
      {/* Module 1 */}
      <Text style={styles.moduleLabel}>THEIR TRACK RECORD</Text>
      <View style={styles.placeRow}>
        <Image source={listing ? photoFor(listing.id) : undefined} style={styles.thumb} resizeMode="cover" />
        <View style={styles.placeMeta}>
          <Text style={styles.placeTitle}>{host.name}'s own place in {listing?.area?.split(',')[0]}</Text>
          <Text style={styles.placeCaption}>{c.placeCaption}</Text>
          <View style={styles.pillRow}>
            <BorderPill label={`Hosted ${guestBook.summary.count} times`} />
            <BorderPill label={story.guestTrackRecord.length ? 'Has stayed too' : "Hasn't been a guest yet"} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.trio}>
          {authors.map((a: any, i: number) => (
            <View key={a.id} style={[styles.trioAvatar, i > 0 && { marginLeft: -8 }]}>
              <Avatar id={a.id} name={a.name} tint={a.avatarColor} size={26} ring />
            </View>
          ))}
          <Text style={styles.claim}>{knownCount} of the {guestBook.summary.count} people in their guest book are people you know</Text>
        </View>
        <Text style={styles.readingLine}>{c.reviewRead}</Text>
        <View style={styles.pillRow}>
          <CountPill label={`${story.channels.length} mutuals`} onPress={() => notify('Mutuals')} />
          <CountPill label={`${guestBook.summary.count} guest book entries`} onPress={() => notify('Guest book')} />
          <CountPill label="1 past match" onPress={() => notify('Past match')} />
        </View>
      </View>
      <View style={styles.hairline} />

      {/* Module 2 */}
      {story.channels.length ? (
        <>
          <Text style={styles.h3}>Who's vouched for {host.name}</Text>
          {story.channels.map((ch: any) => (
            <VouchCard key={ch.voucher.id} channel={ch} hostName={host.name} />
          ))}
          <VouchCard ops={{ label: 'Founding Kikier', body: `We met ${host.name} for coffee before we launched in London. One of the first hundred!`, source: 'From us, Jul 2025' }} />

          <View style={styles.h3Row}>
            <Text style={styles.h3}>Where they sit around you</Text>
            <CountPill label={`${story.channels.length} mutuals`} onPress={() => notify('Mutuals')} />
          </View>
          <View style={styles.card}>
            <Disclosure
              open={whyOpen} onToggle={() => setWhyOpen(!whyOpen)}
              leading={<View style={styles.infoIcon}><Text style={styles.infoI}>i</Text></View>}
              title="Why two mutuals is better than one" chevron="plusminus"
            >
              <Text style={styles.disclosureBody}>
                One person vouching can be a favour. Two people who reached {host.name} by different routes, and who
                don't know each other well, are far harder to stage — independent agreement is the signal, not volume.
              </Text>
            </Disclosure>
            <Disclosure
              open={graphOpen} onToggle={() => setGraphOpen(!graphOpen)}
              title={graphOpen ? 'Hide the picture' : 'See the whole picture'} chevron="arrow" topBorder
            >
              <ConnectionRings viewer={viewer} host={host} channels={story.channels} />
              <Text style={styles.graphCaption}>
                Each ring is one step away from you. {host.name} sits two steps out, and you reach them two different
                ways. Past the dotted ring, someone being connected to you stops meaning much at all.
              </Text>
            </Disclosure>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.h3}>How you know {host.name}</Text>
          <View style={styles.directCard}>
            <View style={styles.strip} />
            <View style={styles.head}>
              <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={48} />
              <View style={styles.directBadge}><Loop size={16} color="#FFFFFF" opacity={1} strokeWidth={10} /></View>
              <Text style={styles.directLabel}>You're directly connected</Text>
            </View>
            <Text style={styles.directBody}>
              You don't need a mutual to vouch for {host.name} — you know them yourself. That's the strongest link
              Kiki can show you.
            </Text>
            <View style={styles.directRoute}>
              <Text style={styles.directRouteText}>{story.directLink?.note ?? 'A direct connection of yours.'}</Text>
              {story.directLink ? <TieMeter strength={story.directLink.tie.strength} /> : null}
            </View>
          </View>
        </>
      )}
      <View style={styles.hairline} />

      {/* Module 3 */}
      <Text style={styles.moduleLabel}>WHAT WE THINK, AND WHAT WE DON'T KNOW</Text>
      {inferItems.length ? (
        <View style={styles.dashedCard}>
          <Disclosure
            open={inferOpen} onToggle={() => setInferOpen(!inferOpen)}
            title={`${inferItems.length} thing${inferItems.length === 1 ? '' : 's'} we spotted about you two`}
            subtitle="None of this came from a person. Here's how we worked it out." chevron="plusminus"
          >
            {inferItems.map((it, i) => (
              <View key={i} style={[styles.inferRow, i > 0 && styles.inferDivider]}>
                <Text style={styles.inferClaim}>{it.claim}</Text>
                <Text style={styles.inferSource}>{it.source}</Text>
              </View>
            ))}
          </Disclosure>
        </View>
      ) : null}

      <View style={styles.gapCard}>
        <View style={styles.caveatStrip} />
        <Text style={styles.gapHeading}>What we don't know</Text>
        <Text style={styles.gapRow}>Nobody you know has actually had {host.name} stay with them.</Text>
        <Text style={styles.gapRow}>{c.gapRole}</Text>
      </View>

      {story.consentNames.length ? (
        <View style={styles.consentLine}>
          <Avatar id={story.channels[0].voucher.id} name={story.channels[0].voucher.name} tint={story.channels[0].voucher.avatarColor} size={22} />
          <Text style={styles.consentText}>{story.consentNames.join(' and ')} both said yes to being shown here</Text>
        </View>
      ) : null}
    </>
  );
}

// ---- Cold body -------------------------------------------------------------
function ColdBody({ story, host, copy: c, notify }: any) {
  return (
    <>
      <View style={styles.card}>
        <View style={styles.brokenLoopWrap}><Loop size={40} color={color.brokenLoop} opacity={1} strokeWidth={8} /></View>
        <Text style={styles.coldTitle}>You two don't have anyone in common yet.</Text>
        <Text style={styles.coldBody}>
          We're not going to dress that up. Nobody you know can tell you anything about {host.name}, so here's
          everything we do have instead.
        </Text>
      </View>

      {story.inviter ? (
        <VouchCard
          channel={{ voucher: story.inviter.member, note: `${story.inviter.member.name} invited them`, tie: { strength: 1, reason: `${story.inviter.member.name} is ${story.inviter.degrees} steps from you — far enough not to count.` } }}
          hostName={host.name}
        />
      ) : null}

      <Text style={styles.h3}>Their track record</Text>
      <View style={styles.card}>
        <Text style={styles.claim}>
          They've stayed with {story.guestTrackRecord.length} people. {story.guestTrackRecord.length ? 'Both wrote them a good entry.' : ''}
        </Text>
        {story.guestTrackRecord[0] ? (
          <View style={styles.coldQuote}>
            <Text style={styles.coldQuoteText}>“{story.guestTrackRecord[0].text}”</Text>
            <Text style={styles.coldCite}>{story.guestTrackRecord[0].author.name}, who you don't know</Text>
          </View>
        ) : null}
        <Text style={styles.readingLine}>
          Two strangers saying good things is worth less than one friend saying it. It still isn't nothing.
        </Text>
      </View>

      <View style={styles.gapCard}>
        <View style={styles.caveatStrip} />
        <Text style={styles.gapHeading}>What we don't know</Text>
        <Text style={styles.gapRow}>You've never met {host.name}.</Text>
        <Text style={styles.gapRow}>Nobody in your circle has been in a room with them.</Text>
        <Text style={styles.gapRow}>They've been on Kiki six weeks, so the record is thin either way.</Text>
      </View>

      <View style={styles.nextCard}>
        <Text style={styles.nextTitle}>You don't have to decide on this today</Text>
        <Text style={styles.nextLead}>Plenty of good matches start out cold. A few things that help:</Text>
        {['Let us introduce you properly', 'Have a quick call before you say yes', `Offer them 1 night instead of ${3}`].map((t) => (
          <Pressable key={t} style={({ pressed }) => [styles.nextRow, pressed && styles.nextRowPressed]} onPress={() => notify(t)}>
            <Text style={styles.nextRowText}>{t} ›</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

// ---- helpers ----
function ProfileTab({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable style={styles.tab} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}
function BorderPill({ label }: { label: string }) {
  return <View style={styles.borderPill}><Text style={styles.borderPillText}>{label}</Text></View>;
}

/** The inference list is the sourced subset (origin/education/event), never all overlaps. */
function selectInferences(overlaps: Overlap[]): { claim: string; source: string }[] {
  const src: Record<string, string> = {
    inferred: 'From our own event list. You might have met.',
    self_declared: 'You both typed that yourselves. We haven\'t checked it.',
    matched: 'An exact match on file.',
  };
  return overlaps
    .filter((o) => o.kind === 'origin' || o.kind === 'education' || o.kind === 'event')
    .map((o) => ({ claim: o.label.replace(/^You (both|were both)/, 'You $1'), source: src[o.provenance] }));
}

function copy(p: P, host: string, names: string[], mutuals: number, hostedCount: number, direct = false) {
  if (p === 'host') {
    return {
      profileSub: direct ? 'Guest · a direct connection of yours' : `Guest · ${mutuals} mutuals with you`,
      ctaLabel: 'Reply',
      placeCaption: `This is the flat ${host} keeps for themselves — the closest thing to a preview of how they'll keep yours.`,
      reviewRead: `Every review talks about ${host} as a host. Not one is from someone who had them as a guest — which is what you'd be doing.`,
      gapRole: `${host} has hosted before but has never been a guest on Kiki, so nobody has written about how they treat someone else's home.`,
    };
  }
  return {
    profileSub: `Host · ${hostedCount} stays · 2 past matches`,
    ctaLabel: 'Request to book',
    placeCaption: `This is the room you'd be sleeping in. People you know have already slept in it.`,
    reviewRead: `Every one of these is about staying in their place, which is exactly what you're about to do.`,
    gapRole: `Every account of ${host}'s home is from someone who stayed. If your situation is different, none of it is about you.`,
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.screen },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 2 },
  back: { fontSize: 28, color: color.ink, fontWeight: '700' },
  saveHeart: { fontSize: 21, color: color.inkFaint },
  identity: { alignItems: 'center', gap: 4, paddingHorizontal: 18, paddingTop: 6 },
  name: { fontSize: 23, fontWeight: '700', letterSpacing: -0.4, color: color.ink, marginTop: 6 },
  sub: { fontSize: 14, color: color.inkFaint },
  tabbar: { flexDirection: 'row', marginTop: 16, borderBottomWidth: 1, borderBottomColor: color.hairline, position: 'relative' },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 12 },
  tabText: { fontSize: 15, fontWeight: '600', color: color.inkFaint },
  tabTextActive: { fontWeight: '700', color: color.ink },
  indicator: { position: 'absolute', bottom: 0, left: '66.666%', width: '33.333%', height: 2.5, backgroundColor: color.ink, borderRadius: 2 },
  perspRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end', paddingHorizontal: 18, paddingVertical: 8 },
  perspHint: { fontSize: 12, color: color.inkFaint },
  segment: { flexDirection: 'row', backgroundColor: color.hairline, borderRadius: radius.pill, padding: 3 },
  segBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  segActive: { backgroundColor: color.surface },
  segText: { fontSize: 12, fontWeight: '700', color: color.inkFaint },
  segTextActive: { color: color.ink },
  body: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 26, gap: 14 },
  requestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  datePill: { backgroundColor: color.ink, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  datePillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  timestamp: { fontSize: 13, color: color.inkFaint },
  moduleLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, color: color.inkFaint, paddingTop: 2 },
  placeRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 92, height: 92, borderRadius: 14, backgroundColor: color.hairline },
  placeMeta: { flex: 1, gap: 6 },
  placeTitle: { fontSize: 14.5, fontWeight: '700', color: color.ink },
  placeCaption: { fontSize: 13, lineHeight: 19, color: color.inkSoft },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  borderPill: { borderWidth: 1, borderColor: color.hairline, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  borderPillText: { fontSize: 11.5, fontWeight: '700', color: color.inkSoft },
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.hairline, borderRadius: 18, padding: 14, gap: 11 },
  directCard: { backgroundColor: color.brandTint, borderRadius: 18, padding: 16, paddingLeft: 19, gap: 12, overflow: 'hidden' },
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.brand },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  directBadge: { position: 'absolute', left: 0, bottom: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  directLabel: { flex: 1, fontSize: 14.5, fontWeight: '700', color: color.textOnMint },
  directBody: { fontSize: 13.5, lineHeight: 20, color: color.textOnMintSoft },
  directRoute: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: color.hairlineTint, paddingTop: 8 },
  directRouteText: { flex: 1, fontSize: 12, color: color.textOnMintSoft },
  trio: { flexDirection: 'row', alignItems: 'center' },
  trioAvatar: {},
  claim: { flex: 1, fontSize: 14.5, fontWeight: '600', color: color.ink, marginLeft: 10 },
  readingLine: { fontSize: 13.5, lineHeight: 20, color: color.inkSoft },
  hairline: { height: 1, backgroundColor: color.hairline, marginVertical: 2 },
  h3: { fontSize: 15, fontWeight: '700', color: color.ink },
  h3Row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoIcon: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: color.dashedTint, alignItems: 'center', justifyContent: 'center' },
  infoI: { fontSize: 11.5, fontWeight: '700', color: color.textOnMint },
  disclosureBody: { fontSize: 13.5, lineHeight: 20, color: color.inkSoft },
  graphCaption: { fontSize: 13, lineHeight: 20, color: color.inkSoft, marginTop: 8 },
  dashedCard: { backgroundColor: color.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D9D9D4', borderRadius: 18, paddingHorizontal: 14 },
  inferRow: { gap: 2, paddingVertical: 8 },
  inferDivider: { borderTopWidth: 1, borderTopColor: color.hairlineSoft },
  inferClaim: { fontSize: 14.5, lineHeight: 20, color: color.ink },
  inferSource: { fontSize: 12, color: color.inkFaint },
  gapCard: { backgroundColor: color.surface, borderRadius: 18, padding: 14, paddingLeft: 16, gap: 9, overflow: 'hidden' },
  caveatStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  gapHeading: { fontSize: 13, fontWeight: '700', color: color.caveat },
  gapRow: { fontSize: 14.5, lineHeight: 21, color: color.ink },
  consentLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  consentText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: color.textOnMint },
  brokenLoopWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: color.screen, alignItems: 'center', justifyContent: 'center' },
  coldTitle: { fontSize: 16, fontWeight: '700', color: color.ink },
  coldBody: { fontSize: 13.5, lineHeight: 20, color: color.inkSoft },
  coldQuote: { backgroundColor: color.screen, borderRadius: 12, padding: 12, paddingHorizontal: 14 },
  coldQuoteText: { fontSize: 13.5, lineHeight: 20, color: color.ink },
  coldCite: { fontSize: 12, color: color.inkSoft, marginTop: 6 },
  nextCard: { backgroundColor: color.brandTint, borderRadius: 18, padding: 14, gap: 10 },
  nextTitle: { fontSize: 14.5, fontWeight: '700', color: color.textOnMint },
  nextLead: { fontSize: 13.5, color: color.ink },
  nextRow: { backgroundColor: color.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  nextRowPressed: { transform: [{ scale: 0.985 }], backgroundColor: color.dashedTint },
  nextRowText: { fontSize: 13.5, fontWeight: '600', color: color.textOnMint },
  // footer
  footer: { backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.hairline, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22, gap: 8 },
  toast: { backgroundColor: color.ink, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  toastText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '600' },
  secondary: { borderWidth: 1, borderColor: color.brand, borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 12 },
  secondaryPressed: { backgroundColor: color.brandTint, transform: [{ scale: 0.985 }] },
  secondaryText: { fontSize: 14.5, fontWeight: '600', color: color.textOnMint },
  secondarySub: { fontSize: 12.5, color: color.textOnMintSoft },
  primaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryName: { fontSize: 14, fontWeight: '600', color: color.ink },
  primaryPrice: { fontSize: 12.5, color: color.inkFaint },
  primaryBtn: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 13 },
  primaryPressed: { transform: [{ scale: 0.97 }], backgroundColor: color.brandDark },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
