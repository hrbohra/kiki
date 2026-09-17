import { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { Chip } from '../../ui/Chip';
import { Loop } from '../../ui/Loop';
import { SentimentMeter } from '../../ui/Bars';
import { TrustPill } from '../../ui/TrustPill';
import { photoFor } from '../../ui/listingPhotos';
import { WEB_SHADOW } from './webBits';
import { TrustWeb } from '../TrustWeb';
import { GraphModal } from './GraphModal';
import { profileDetail } from '../../domain/profiles';
import { bakedBio } from '../../domain/generated';
import { relRange } from '../../domain/relDates';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';
import type { RootNav } from '../../navigation';

type Tab = 'room' | 'profile' | 'trust';
type P = 'host' | 'guest';

/**
 * The one way into a person on desktop. A single overlay with its own nav (Loop → Explore, the
 * Room / Profile / Trust tabs, and the host/guest reading toggle) sharing one identity card. This
 * replaced the separate host-profile page that duplicated the Trust page with different chrome.
 */
export function PersonView({ hostId, initialTab, navigation, as: entryAs }: { hostId: string; initialTab: Tab; navigation: RootNav; as?: 'host' | 'guest' }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  // 'The host' / 'The guest' are facets of THEM: arriving as the host, you read their guest side.
  const [view, setView] = useState<P>(entryAs === 'host' ? 'guest' : 'host');

  return (
    <View style={styles.root}>
      <View style={styles.nav}>
        <View style={styles.navInner}>
          <Pressable style={styles.wordmark} onPress={() => navigation.popToTop()} accessibilityRole="button" accessibilityLabel="Back to Explore">
            <Loop size={30} color={color.brand} opacity={1} strokeWidth={9} />
            <Text style={styles.brand}>Kiki</Text>
          </Pressable>
          <View style={styles.tabs}>
            {(['room', 'profile', 'trust'] as Tab[]).map((t) => (
              <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)} accessibilityRole="button">
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABEL[t]}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.segment}>
            {(['host', 'guest'] as P[]).map((p) => (
              <Pressable key={p} onPress={() => setView(p)} style={[styles.segBtn, view === p && styles.segActive]}>
                <Text style={[styles.segText, view === p && styles.segTextActive]}>{p === 'host' ? 'The host' : 'The guest'}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {tab === 'trust' ? (
        <TrustWeb hostId={hostId} navigation={navigation} embedded perspective={view} onPerspective={setView} reader={entryAs ?? 'guest'} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.shell}>
            {tab === 'room'
              ? <RoomPanel hostId={hostId} perspective={view} navigation={navigation} />
              : <ProfilePanel hostId={hostId} perspective={view} navigation={navigation} onOpenTrust={() => setTab('trust')} />}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const TAB_LABEL: Record<Tab, string> = { room: 'Room', profile: 'Profile', trust: 'Trust' };

// ---- Identity card (shared by Room + Profile) -------------------------------
function IdentityCard({ hostId, perspective }: { hostId: string; perspective: P }) {
  const c = identityCopy(hostId, perspective);
  const host = c.host;
  return (
    <View style={[styles.card, styles.identity]}>
      <View style={styles.idLoop} pointerEvents="none"><Loop size={200} color={color.brand} opacity={0.07} strokeWidth={5} /></View>
      <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={92} ring />
      <Text style={styles.name}>{host.name}</Text>
      <Text style={styles.role}>{c.role}</Text>
      <View style={styles.datePill}><Text style={styles.datePillText}>{c.dates}</Text></View>
      <Text style={styles.headline}>{c.headline}</Text>
      <Text style={styles.qualifier}>{c.qualifier}</Text>
    </View>
  );
}

// ---- Profile tab -----------------------------------------------------------
function ProfilePanel({ hostId, perspective, navigation, onOpenTrust }: { hostId: string; perspective: P; navigation: RootNav; onOpenTrust: () => void }) {
  const host = world.memberById(hostId);
  const listing = world.listingForHost(hostId);
  const detail = profileDetail(hostId, listing?.area);
  const story = world.storyFor(hostId);
  const channelCount = world.trustStoryFor(hostId).channels.length;
  const { summary } = world.guestBookOf(hostId);
  const voucherNames = story.reachable ? namesOf(hostId) : '';
  const [graphOpen, setGraphOpen] = useState(false);

  return (
    <>
      <View style={styles.leftCol}>
        <IdentityCard hostId={hostId} perspective={perspective} />
        <View style={[styles.card, styles.aboutCard]}>
          <Text style={styles.sectionTitle}>About {host.name}</Text>
          <Text style={styles.bio}>{bakedBio(hostId) ?? detail.bio}</Text>
          <View style={styles.goodToKnow}>
            <Fact label="Member since" value={detail.memberSince} />
            <Fact label="Speaks" value={detail.languages.join(', ')} />
            <Fact label="Responds" value={detail.responds} />
          </View>
        </View>
      </View>

      <View style={styles.rightCol}>
        <View style={[styles.card, styles.intoCard]}>
          <Text style={styles.sectionTitle}>What {host.name} is into</Text>
          <View style={styles.tags}>{host.traits.map((t) => <Chip key={t.key} label={cleanTrait(t.label)} readOnly />)}</View>
        </View>

        <Pressable style={({ hovered }: any) => [styles.card, styles.door, hovered && styles.doorHover]} onPress={onOpenTrust}>
          <Row title="Can you trust them?" cta="Open the Trust page" />
          <Text style={styles.lead}>
            {story.reachable
              ? story.degrees === 1
                ? `You know ${host.name} directly.`
                : `${channelCount || story.degrees} people connect you${voucherNames ? ` — via ${voucherNames}` : ''}.`
              : `${host.name} is new to your circle.`}
          </Text>
        </Pressable>

        <Pressable style={({ hovered }: any) => [styles.card, styles.door, hovered && styles.doorHover]} onPress={() => setGraphOpen(true)}>
          <Row title="How you're connected" cta="View the route" />
          <Text style={styles.lead}>See the people who link you to {host.name}.</Text>
        </Pressable>

        <Pressable style={({ hovered }: any) => [styles.card, styles.door, hovered && styles.doorHover]} onPress={() => navigation.navigate('GuestBook', { hostId })}>
          <Row title="Guest book" cta={`${summary.count} guest book entries`} />
          {summary.count > 0 ? (
            <>
              <SentimentMeter score={summary.avgScore} />
              <View style={styles.signals}>{summary.trustSignalCounts.slice(0, 4).map((s) => <TrustPill key={s.signal} label={s.signal} tone="outline" />)}</View>
            </>
          ) : <Text style={styles.lead}>No stays yet — you'd be their first.</Text>}
        </Pressable>
      </View>
      {graphOpen ? <GraphModal hostId={hostId} onClose={() => setGraphOpen(false)} /> : null}
    </>
  );
}

// ---- Room tab --------------------------------------------------------------
function RoomPanel({ hostId, perspective, navigation }: { hostId: string; perspective: P; navigation: RootNav }) {
  const host = world.memberById(hostId);
  const listing = world.listingForHost(hostId);
  const detail = profileDetail(hostId, listing?.area);

  return (
    <>
      <View style={styles.leftCol}>
        <IdentityCard hostId={hostId} perspective={perspective} />
      </View>
      <View style={styles.rightCol}>
        <View style={[styles.card, styles.roomCard]}>
          {listing ? <Image source={photoFor(listing.id)} style={styles.roomPhoto} resizeMode="cover" /> : null}
          <View style={styles.roomBody}>
            <Text style={styles.roomRate}>£{listing?.pricePerWeek ?? 0} / week · {listing?.kind} · {listing?.area}</Text>
            <Text style={styles.roomDesc}>{detail.roomDescription}</Text>

            <Text style={styles.eyebrow}>WHAT'S HERE</Text>
            <View style={styles.tags}>{detail.amenities.map((a) => <Chip key={a} label={a} readOnly />)}</View>

            <View style={styles.houseNotes}>
              <Text style={styles.houseNotesTitle}>House notes</Text>
              <Text style={styles.houseNotesText}>{detail.houseNotes}</Text>
            </View>

            <Pressable style={styles.cta} onPress={() => navigation.navigate('Thread', { memberId: hostId })}><Text style={styles.ctaText}>Message {host.name}</Text></Pressable>
            <Text style={styles.roomNote}>Photos are the host's own. We don't stage or retouch them.</Text>
          </View>
        </View>
      </View>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

/** Tidy a trait label for a chip ("the Dalston picnic in June" → "Dalston picnic in June"). */
function cleanTrait(label: string): string {
  return label.replace(/^the /, '');
}

function Row({ title, cta }: { title: string; cta: string }) {
  return <View style={styles.row}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardCta}>{cta} ›</Text></View>;
}

// ---- copy derived from real data (no fabricated per-person bios) ------------
function identityCopy(hostId: string, p: P) {
  const story = world.trustStoryFor(hostId);
  const host = story.host;
  const voucher = story.channels[0]?.voucher.name;
  const stay = story.warm ? '4 weeks' : '2 weeks';
  const dates = story.warm ? relRange(4, 28) : relRange(18, 14);
  const role = p === 'host' ? 'Hoping to stay with you' : 'Opening up their place';
  const headline = p === 'host'
    ? `${host.name} is taking over your space for ${stay}.`
    : `You'd have ${host.name}'s place to yourself for ${stay}.`;
  const qualifier = p === 'host'
    ? story.warm && voucher ? `Because ${voucher} vouches for them, your keys, your kitchen and your bed are in good hands.`
      : story.direct ? `You know ${host.name} yourself, so your place is in good hands.`
        : `You two don't know each other yet — here's everything we do have, and what we don't.`
    : story.warm && voucher ? `${voucher} vouches for them, and people you know have already stayed — you're in good hands.`
      : story.direct ? `You already know ${host.name}, so this is familiar ground.`
        : `You're new to each other — here's everything we have, and what we can't answer.`;
  return { host, role, dates, headline, qualifier };
}

function namesOf(hostId: string): string {
  const names = world.trustStoryFor(hostId).channels.map((ch) => ch.voucher.name);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.screen },
  nav: { height: 66, backgroundColor: 'rgba(255,255,255,0.94)', borderBottomWidth: 1, borderBottomColor: color.hairline, zIndex: 30 },
  navInner: { flex: 1, maxWidth: 1560, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 24, paddingHorizontal: 40 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  tabs: { flexDirection: 'row', height: '100%' },
  tab: { paddingHorizontal: 15, height: '100%', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: color.ink },
  tabText: { fontSize: 14.5, fontWeight: '600', color: color.inkFaint },
  tabTextActive: { fontWeight: '700', color: color.ink },
  segment: { flexDirection: 'row', backgroundColor: color.surface, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.pill, padding: 3 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  segActive: { backgroundColor: color.bg },
  segText: { fontSize: 13, fontWeight: '700', color: color.inkFaint },
  segTextActive: { color: color.ink },

  scroll: { paddingBottom: 96 },
  shell: { maxWidth: 1560, width: '100%', alignSelf: 'center', paddingHorizontal: 40, paddingTop: 36, flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },
  leftCol: { flexGrow: 1, flexBasis: 376, minWidth: 320, gap: 20 },
  rightCol: { flexGrow: 1, flexBasis: 520, minWidth: 320, gap: 16 },

  card: { backgroundColor: color.surface, borderRadius: 20, ...WEB_SHADOW },
  identity: { padding: 28, gap: 8, overflow: 'hidden' },
  idLoop: { position: 'absolute', top: -20, right: -20 },
  name: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6, color: color.ink, marginTop: 6 },
  role: { fontSize: 14, color: color.inkFaint },
  datePill: { alignSelf: 'flex-start', backgroundColor: color.ink, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7, marginTop: 4 },
  datePillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 26, fontWeight: '700', color: color.ink, marginTop: 6 },
  qualifier: { fontSize: 14, lineHeight: 22, color: color.inkSoft },

  aboutCard: { padding: 20, gap: 14 },
  intoCard: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: color.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bio: { fontSize: 15, lineHeight: 22, color: color.inkSoft },
  goodToKnow: { gap: 8, borderTopWidth: 1, borderTopColor: color.hairlineSoft, paddingTop: 12 },
  factRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  factLabel: { fontSize: 13, color: color.inkFaint },
  factValue: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '600', color: color.ink },

  door: { padding: 20, gap: 12 },
  doorHover: { transform: [{ translateY: -2 }] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: color.ink },
  cardCta: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
  lead: { fontSize: 14.5, lineHeight: 21, color: color.inkSoft },
  signals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  roomCard: { overflow: 'hidden' },
  roomPhoto: { width: '100%', height: 220 },
  roomBody: { padding: 20, gap: 12 },
  roomRate: { fontSize: 17, fontWeight: '700', color: color.ink },
  roomDesc: { fontSize: 15, lineHeight: 22, color: color.inkSoft },
  eyebrow: { fontSize: 11.5, fontWeight: '700', color: color.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  houseNotes: { backgroundColor: color.screen, borderRadius: 12, padding: 14, gap: 4 },
  houseNotesTitle: { fontSize: 13.5, fontWeight: '700', color: color.ink },
  houseNotesText: { fontSize: 14, lineHeight: 21, color: color.inkSoft },
  cta: { backgroundColor: color.brand, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 2 },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  roomNote: { fontSize: 12.5, color: color.inkFaint },
});
