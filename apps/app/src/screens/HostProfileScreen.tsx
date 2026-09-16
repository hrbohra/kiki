import { View, Text, Pressable, ScrollView, Image, StyleSheet, SafeAreaView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { TierBadge } from '../ui/TierBadge';
import { TrustPill } from '../ui/TrustPill';
import { SentimentMeter } from '../ui/Bars';
import { Chip } from '../ui/Chip';
import { CountPill } from '../ui/trust/CountPill';
import { TRAIT_GLYPH } from '../ui/glyphs';
import { PersonTabs } from '../ui/PersonTabs';
import { photoFor } from '../ui/listingPhotos';
import { haptic } from '../ui/feedback';
import { profileDetail } from '../domain/profiles';
import { bakedBio } from '../domain/generated';
import { color, font, radius, space, shadow } from '../theme/tokens';
import { useResponsive } from '../ui/useResponsive';
import { PersonView } from './web/PersonView';
import * as world from '../world';
import type { StackProps } from '../navigation';

/**
 * A host's profile on the phone — the Profile tab of the person page, built to the same standard
 * as its Trust tab: the same hero and chrome, eyebrowed evidence cards, the room itself (photo,
 * rate, what's here, house notes), who they are (bio, facts, what they're into), and the three
 * doors (connection, guest book, trust) each carrying real evidence rather than a label. One
 * sticky action, as on Trust. Wide desktop browsers get the unified PersonView instead.
 */
export function HostProfileScreen(props: StackProps<'HostProfile'>) {
  const { isWide } = useResponsive();
  const { route, navigation } = props;
  if (isWide) return <PersonView hostId={world.listingById(route.params.listingId).hostId} initialTab="profile" navigation={navigation} as="guest" />;
  const listing = world.listingById(route.params.listingId);
  const host = world.hostOf(listing);
  const story = world.storyFor(host.id);
  const trust = world.trustStoryFor(host.id);
  const standing = world.standingOf(host.id);
  const { summary } = world.guestBookOf(host.id);
  const detail = profileDetail(host.id, listing.area);
  const bio = bakedBio(host.id) ?? detail.bio;
  const mutuals = trust.channels.length;

  const connectionLine = story.reachable
    ? story.degrees === 1
      ? `You know ${host.name} directly.`
      : `${story.degrees} steps from you${story.path[1] ? ` — via ${story.path[1].name}` : ''}.`
    : `${host.name} is new to your circle.`;

  const go = (fn: () => void) => () => { haptic.tap(); fn(); };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Nav row — the same back affordance as Trust / Connection / GuestBook / Thread */}
      <View style={styles.nav}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>
      </View>

      {/* Identity — the same hero card as Trust, so Profile ⇄ Trust reads as a tab switch */}
      <View style={styles.heroWrap}>
        <View style={[styles.hero, shadow.card]}>
          <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={92} ring />
          <Text style={styles.name}>{host.name}</Text>
          <Text style={styles.sub}>{listing.title} · {listing.area}</Text>
          <View style={styles.badges}>
            <TierBadge standing={standing} showRank />
            {story.reachable ? <TrustPill label={`${ordinal(story.degrees)} degree`} tone={story.degrees >= 3 ? 'outline' : 'tint'} /> : null}
          </View>
        </View>
        <PersonTabs active="profile" onTrust={() => navigation.navigate('Trust', { hostId: host.id, as: 'guest' })} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Their place */}
        <View style={styles.card}>
          <Text style={styles.eyebrow}>THEIR PLACE</Text>
          <View style={[styles.photoWrap, { backgroundColor: listing.photoColor }]}>
            <Image source={photoFor(listing.id)} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={`${listing.title} — ${host.name}'s place in ${listing.area}`} />
            <View style={styles.photoPills}>
              <View style={styles.photoPill}><Text style={styles.photoPillKind}>{listing.kind}</Text></View>
              <View style={styles.photoPill}><Text style={styles.photoPillPrice}>£{listing.pricePerNight} / night</Text></View>
            </View>
          </View>
          <Text style={styles.bodyText}>{detail.roomDescription}</Text>
          <Text style={styles.subEyebrow}>WHAT'S HERE</Text>
          <View style={styles.chips}>{detail.amenities.map((a) => <Chip key={a} label={a} readOnly />)}</View>
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>House notes</Text>
            <Text style={styles.notesText}>{detail.houseNotes}</Text>
          </View>
          <Text style={styles.caption}>Photos are the host's own. We don't stage or retouch them.</Text>
        </View>

        {/* Who they are */}
        <View style={styles.card}>
          <Text style={styles.eyebrow}>ABOUT {host.name.toUpperCase()}</Text>
          <Text style={styles.bodyText}>{bio}</Text>
          <View style={styles.facts}>
            <Fact label="Member since" value={detail.memberSince} />
            <Fact label="Speaks" value={detail.languages.join(', ')} />
            <Fact label="Responds" value={detail.responds} />
          </View>
          {host.traits.length ? (
            <>
              <Text style={styles.subEyebrow}>WHAT {host.name.toUpperCase()} IS INTO</Text>
              <View style={styles.traitList}>
                {host.traits.map((t) => {
                  const G = TRAIT_GLYPH[t.kind];
                  return (
                    <View key={t.key} style={styles.traitRow}>
                      {G ? <G size={16} color={color.inkSoft} accent={color.brand} /> : null}
                      <Text style={styles.traitLabel}>{cleanTrait(t.label)}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>

        {/* Door 1: connection */}
        <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={go(() => navigation.navigate('Connection', { hostId: host.id }))} accessibilityRole="button">
          <Text style={styles.eyebrow}>HOW YOU'RE CONNECTED</Text>
          <Text style={styles.lead}>{connectionLine}</Text>
          {story.overlaps[0] ? (
            <View style={styles.overlapRow}>
              {(() => { const G = TRAIT_GLYPH[story.overlaps[0].kind]; return G ? <G size={16} color={color.inkSoft} accent={color.brand} /> : null; })()}
              <Text style={styles.overlap}>{story.overlaps[0].label}</Text>
            </View>
          ) : null}
          <Text style={styles.link}>See the route ›</Text>
        </Pressable>

        {/* Door 2: guest book */}
        <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={go(() => navigation.navigate('GuestBook', { hostId: host.id }))} accessibilityRole="button">
          <Text style={styles.eyebrow}>GUEST BOOK</Text>
          {summary.count > 0 ? (
            <>
              <Text style={styles.lead}>{summary.count} {summary.count === 1 ? 'entry' : 'entries'} from people who stayed.</Text>
              <SentimentMeter score={summary.avgScore} />
              <View style={styles.chips}>
                {summary.trustSignalCounts.slice(0, 3).map((s) => <TrustPill key={s.signal} label={`${s.signal} ·${s.count}`} tone="outline" />)}
              </View>
            </>
          ) : (
            <Text style={styles.lead}>No stays yet — you'd be their first.</Text>
          )}
          <Text style={styles.link}>Read the entries ›</Text>
        </Pressable>

        {/* Door 3: trust */}
        <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={go(() => navigation.navigate('Trust', { hostId: host.id, as: 'guest' }))} accessibilityRole="button">
          <Text style={styles.eyebrow}>TRUST</Text>
          <Text style={styles.lead}>Can you trust {host.name} with your home, or theirs with you? The evidence, and what we can't answer.</Text>
          <View style={styles.chips}>
            <CountPill label={`${mutuals} ${mutuals === 1 ? 'mutual' : 'mutuals'}`} />
            <CountPill label={`${summary.count} guest book ${summary.count === 1 ? 'entry' : 'entries'}`} />
            {story.reachable ? <CountPill label={`${ordinal(story.degrees)} degree`} /> : null}
          </View>
          <Text style={styles.link}>Open the trust page ›</Text>
        </Pressable>
      </ScrollView>

      {/* Sticky footer — the same shape as Trust's */}
      <View style={styles.footer}>
        <View style={styles.primaryRow}>
          <View style={styles.primaryLeft}>
            <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={34} />
            <View>
              <Text style={styles.primaryName}>{host.name} · {listing.kind}</Text>
              <Text style={styles.primaryPrice}>£{listing.pricePerNight} / night · {listing.area.split(',')[0]}</Text>
            </View>
          </View>
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]} onPress={go(() => navigation.navigate('Thread', { memberId: host.id }))} accessibilityRole="button">
            <Text style={styles.primaryBtnText}>Message {host.name}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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

function cleanTrait(label: string): string {
  return label.replace(/^the /, '');
}

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 2 },
  back: { ...font.h3, color: color.brand },
  heroWrap: { paddingHorizontal: 18, paddingTop: 6 },
  hero: { backgroundColor: color.surface, borderRadius: radius.hero, padding: space.xl, alignItems: 'center', gap: space.sm },
  name: { ...font.h2, marginTop: space.sm },
  sub: { ...font.caption },
  badges: { flexDirection: 'row', gap: space.sm, marginTop: space.xs, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  body: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, gap: 14 },

  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.hairline, borderRadius: 18, padding: 14, gap: 11 },
  cardPressed: { opacity: 0.97 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: color.inkFaint },
  subEyebrow: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, color: color.inkFaint, marginTop: 2 },
  lead: { ...font.body, color: color.ink },
  bodyText: { fontSize: 14.5, lineHeight: 21, color: color.ink },
  caption: { fontSize: 12, color: color.inkFaint },
  link: { fontSize: 13.5, fontWeight: '700', color: color.brand },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  photoWrap: { height: 172, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-start' },
  photoPills: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  photoPill: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  photoPillKind: { fontSize: 12, fontWeight: '700', color: color.inkSoft },
  photoPillPrice: { fontSize: 12, fontWeight: '700', color: color.ink },
  notes: { backgroundColor: color.screen, borderRadius: 12, padding: 12, paddingHorizontal: 14, gap: 4 },
  notesTitle: { fontSize: 13, fontWeight: '700', color: color.ink },
  notesText: { fontSize: 13.5, lineHeight: 20, color: color.inkSoft },

  facts: { gap: 6, borderTopWidth: 1, borderTopColor: color.hairlineSoft, paddingTop: 10 },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  factLabel: { fontSize: 13, color: color.inkFaint },
  factValue: { fontSize: 13, fontWeight: '600', color: color.ink, flexShrink: 1, textAlign: 'right' },
  traitList: { gap: 8 },
  traitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  traitLabel: { fontSize: 14, fontWeight: '600', color: color.ink, flex: 1 },
  overlapRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overlap: { ...font.body, color: color.ink, fontWeight: '600', flex: 1 },

  footer: { backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.hairline, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22, gap: 8 },
  primaryRow: { flexWrap: 'wrap', rowGap: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryName: { fontSize: 14, fontWeight: '600', color: color.ink },
  primaryPrice: { fontSize: 12.5, color: color.inkFaint },
  primaryBtn: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 13, ...shadow.brand },
  primaryPressed: { transform: [{ scale: 0.97 }], backgroundColor: color.brandDark },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
