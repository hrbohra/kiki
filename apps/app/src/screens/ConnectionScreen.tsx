import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { RouteGraph } from '../ui/RouteGraph';
import { RouteList } from '../ui/RouteList';
import { OverlapList } from '../ui/OverlapList';
import { Avatar } from '../ui/Avatar';
import { TrustPill } from '../ui/TrustPill';
import { haptic } from '../ui/feedback';
import { color, font, radius, space, shadow } from '../theme/tokens';
import * as world from '../world';
import type { StackProps } from '../navigation';

/**
 * "How you're connected" — redesigned with the 17 Sep handoff. Every shortest route is drawn and
 * weighted, your other people stay faint as context, the host's next ring is a count, and the
 * route list repeats the picture in words. The primary action follows the graph: on a route of
 * two or more steps the person to talk to first is the mutual, so the button says "Ask Nina".
 */
export function ConnectionScreen({ route, navigation }: StackProps<'Connection'>) {
  const host = world.memberById(route.params.hostId);
  const story = world.trustStoryFor(host.id);
  const viewer = world.memberById(world.viewerId);
  const others = world.viewerFriendNames(story.rankedRoutes.flatMap((r) => r.members.map((m) => m.id)));
  const routes = story.rankedRoutes;
  const mutual = routes[0] && routes[0].members.length > 2 ? routes[0].members[1] : null;
  const first = (m: { name: string }) => m.name.split(' ')[0];

  const headline = !story.reachable
    ? `${first(host)} is new to your circle`
    : story.direct
      ? `You know ${first(host)} directly`
      : `${WORDS[story.degrees] ?? story.degrees} steps from you`;
  const sub = !story.reachable
    ? 'Nobody you know has met them yet'
    : story.direct
      ? story.directLink?.tie.reason ?? 'A direct connection of yours.'
      : routes.length === 1
        ? `One route, through ${routes[0].members.slice(1, -1).map(first).join(' and ')}.`
        : `${WORDS[routes.length] ?? routes.length} routes. ${routes.length === 2 ? 'Both' : 'All'} through people you can call.`;

  const go = (fn: () => void) => () => { haptic.tap(); fn(); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, shadow.card]}>
          <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={92} ring />
          <Text style={styles.name}>{headline}</Text>
          <Text style={styles.sub}>{sub}</Text>
          <View style={styles.badges}>
            {story.reachable ? <TrustPill label={`${ordinal(story.degrees)} degree`} tone={story.degrees >= 3 ? 'outline' : 'tint'} /> : <TrustPill label="Not yet connected" tone="outline" />}
            {story.reachable ? <TrustPill label="Everyone drawn agreed to be named" tone="outline" /> : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>THE ROUTES</Text>
          {story.reachable ? (
            <>
              <RouteGraph viewer={viewer} host={host} routes={routes} otherPeople={others} nextRingCount={story.nextRingCount} reachable={story.reachable} direct={story.direct} />
              <View style={styles.hairline} />
              <RouteList story={story} />
              <Text style={styles.caption}>
                {routes.length >= 2 ? 'Thick line, strong tie. Two routes is the strongest signal Kiki can show; everyone drawn agreed to be named.' : 'Thick line, strong tie. Kiki shows the route, not a score; everyone drawn agreed to be named.'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.lead}>Nobody you know can tell you anything about {first(host)} yet.</Text>
              <Text style={styles.caption}>We're not going to dress that up. Here's everything we do have instead.</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>WHAT YOU HAVE IN COMMON</Text>
          {story.overlaps.length ? (
            <OverlapList overlaps={story.overlaps} />
          ) : (
            <Text style={styles.lead}>Nothing on record yet — that's a fact, not a gap we're hiding.</Text>
          )}
          <Text style={styles.caption}>Shared facts, not a compatibility score. A shared hometown is common ground, never evidence of safety.</Text>
        </View>

        <Text style={styles.footnote}>
          Overlaps come from the facts each of you chose to share; the mutual-friend introduction is written live from this same graph.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.primaryRow}>
          <View style={styles.primaryLeft}>
            <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={34} />
            <View>
              <Text style={styles.primaryName}>{host.name}</Text>
              <Text style={styles.primaryPrice} numberOfLines={1}>{story.reachable ? `${ordinal(story.degrees)} degree${mutual ? ` · via ${first(mutual)}` : ''}` : 'New to your circle'}</Text>
            </View>
          </View>
          {mutual ? (
            <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]} onPress={go(() => navigation.navigate('Thread', { memberId: mutual.id }))} accessibilityRole="button" accessibilityHint={`Message ${first(mutual)}, who connects you to ${first(host)}`}>
              <Text style={styles.primaryBtnText}>Ask {first(mutual)}</Text>
            </Pressable>
          ) : (
            <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]} onPress={go(() => navigation.navigate('Thread', { memberId: host.id }))} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Message {first(host)}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const WORDS: Record<number, string> = { 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six' };

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 2 },
  back: { ...font.h3, color: color.brand },
  hero: { backgroundColor: color.surface, borderRadius: radius.hero, padding: space.xl, alignItems: 'center', gap: space.sm },
  name: { ...font.h2, marginTop: space.sm, textAlign: 'center' },
  sub: { ...font.caption, textAlign: 'center' },
  badges: { flexDirection: 'row', gap: space.sm, marginTop: space.xs, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  body: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 110, gap: 14 },
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.hairline, borderRadius: 18, padding: 14, gap: 11 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: color.inkFaint },
  lead: { ...font.body, color: color.ink },
  caption: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
  hairline: { height: 1, backgroundColor: color.hairlineSoft },
  footnote: { ...font.caption, lineHeight: 18, color: color.inkFaint },
  footer: { backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.hairline, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22, gap: 8 },
  primaryRow: { flexWrap: 'wrap', rowGap: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1, minWidth: 0 },
  primaryName: { fontSize: 14, fontWeight: '600', color: color.ink },
  primaryPrice: { fontSize: 12.5, color: color.inkFaint },
  primaryBtn: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 13, ...shadow.brand },
  primaryPressed: { transform: [{ scale: 0.97 }], backgroundColor: color.brandDark },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
