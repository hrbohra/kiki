import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { TierBadge } from '../ui/TierBadge';
import { TrustPill } from '../ui/TrustPill';
import { SentimentMeter } from '../ui/Bars';
import { Chip } from '../ui/Chip';
import { Loop } from '../ui/Loop';
import { TRAIT_GLYPH } from '../ui/glyphs';
import { PersonTabs } from '../ui/PersonTabs';
import { color, font, radius, space, shadow } from '../theme/tokens';
import { useResponsive } from '../ui/useResponsive';
import { PersonView } from './web/PersonView';
import * as world from '../world';
import type { StackProps } from '../navigation';

/** A host's profile: hero, doors (connection / guest book / trust), one action.
 *  Wide desktop browsers get the unified PersonView (Room/Profile/Trust); narrow keeps this screen. */
export function HostProfileScreen(props: StackProps<'HostProfile'>) {
  const { isWide } = useResponsive();
  const { route, navigation } = props;
  if (isWide) return <PersonView hostId={world.listingById(route.params.listingId).hostId} initialTab="profile" navigation={navigation} />;
  const listing = world.listingById(route.params.listingId);
  const host = world.hostOf(listing);
  const story = world.storyFor(host.id);
  const standing = world.standingOf(host.id);
  const { summary } = world.guestBookOf(host.id);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, shadow.card]}>
          <View style={styles.heroLoop} pointerEvents="none">
            <Loop size={240} color={color.brand} opacity={0.09} strokeWidth={5} />
          </View>
          <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={92} ring />
          <Text style={styles.name}>{host.name}</Text>
          <Text style={styles.sub}>{listing.title} · {listing.area}</Text>
          <View style={styles.badges}>
            <TierBadge standing={standing} showRank />
            {story.reachable ? <TrustPill label={`${ordinal(story.degrees)} degree`} tone="tint" /> : null}
          </View>
          <View style={styles.tagRow}>
            {listing.tags.map((t) => <Chip key={t} label={t} readOnly />)}
          </View>
        </View>

        <PersonTabs active="profile" onTrust={() => navigation.navigate('Trust', { hostId: host.id, as: 'guest' })} />

        {/* Door 1: connection */}
        <Pressable style={({ pressed }) => [styles.card, shadow.card, pressed && styles.cardPressed]} onPress={() => navigation.navigate('Connection', { hostId: host.id })}>
          <Row title="How you're connected" cta="View graph" />
          <Text style={styles.cardLead}>
            {story.reachable
              ? story.degrees === 1
                ? `You know ${host.name} directly.`
                : `${story.degrees} people connect you${story.path[1] ? ` — via ${story.path[1].name}` : ''}.`
              : `${host.name} is new to your circle.`}
          </Text>
          {story.overlaps[0] ? (
            <>
              <View style={styles.hairline} />
              <View style={styles.overlapRow}>
                {(() => { const G = TRAIT_GLYPH[story.overlaps[0].kind]; return <G size={16} color={color.inkSoft} accent={color.brand} />; })()}
                <Text style={styles.overlap}>{story.overlaps[0].label}</Text>
              </View>
            </>
          ) : null}
        </Pressable>

        {/* Door 2: guest book */}
        <Pressable style={({ pressed }) => [styles.card, shadow.card, pressed && styles.cardPressed]} onPress={() => navigation.navigate('GuestBook', { hostId: host.id })}>
          <Row title="Guest book" cta={`${summary.count} reviews`} />
          {summary.count > 0 ? (
            <>
              <SentimentMeter score={summary.avgScore} />
              <View style={styles.signalRow}>
                {summary.trustSignalCounts.slice(0, 3).map((s) => (
                  <TrustPill key={s.signal} label={`${s.signal} ·${s.count}`} tone="outline" />
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.cardLead}>No stays yet — you'd be their first.</Text>
          )}
        </Pressable>

        {/* Door 3: trust */}
        <Pressable style={({ pressed }) => [styles.card, shadow.card, pressed && styles.cardPressed]} onPress={() => navigation.navigate('Trust', { hostId: host.id, as: 'guest' })}>
          <Row title="Trust" cta="Open" />
          <Text style={styles.cardLead}>Can you trust {host.name} with your home, or theirs with you? The evidence, and what we can't answer.</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={() => navigation.navigate('Thread', { memberId: host.id })}>
          <Text style={styles.ctaText}>Message {host.name}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ title, cta }: { title: string; cta: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardCta}>{cta} ›</Text>
    </View>
  );
}

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  navbar: { paddingHorizontal: space.screen, paddingVertical: space.md },
  back: { ...font.h3, color: color.brand },
  body: { padding: space.screen, paddingBottom: space.xxl, gap: space.md },
  hero: { backgroundColor: color.surface, borderRadius: radius.hero, padding: space.xl, alignItems: 'center', gap: space.sm, overflow: 'hidden' },
  heroLoop: { position: 'absolute', top: -30, alignSelf: 'center' },
  name: { ...font.h2, marginTop: space.sm },
  sub: { ...font.caption },
  badges: { flexDirection: 'row', gap: space.sm, marginTop: space.xs, alignItems: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center', marginTop: space.sm },
  card: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.hairline, padding: space.card, gap: space.md },
  cardPressed: { opacity: 0.97 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...font.h3 },
  cardCta: { ...font.caption, color: color.brand, fontWeight: '700' },
  cardLead: { ...font.body, color: color.ink },
  hairline: { height: 1, backgroundColor: color.hairlineSoft },
  overlapRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overlap: { ...font.body, color: color.ink, fontWeight: '600', flex: 1 },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cta: { backgroundColor: color.brand, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', ...shadow.brand },
  ctaPressed: { backgroundColor: color.brandDark },
  ctaText: { ...font.button },
});
