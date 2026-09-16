import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { GraphView } from '../ui/GraphView';
import { ConnectionPath } from '../ui/ConnectionPath';
import { OverlapList } from '../ui/OverlapList';
import { Avatar } from '../ui/Avatar';
import { TrustPill } from '../ui/TrustPill';
import { haptic } from '../ui/feedback';
import { color, font, radius, space, shadow } from '../theme/tokens';
import * as world from '../world';
import type { StackProps } from '../navigation';

/**
 * "How you know this host" — answered in three descending scales: a sentence, a picture, the
 * evidence. Built to the person page's standard: the same hero card, eyebrowed cards, and one
 * sticky action. The route is drawn as a diagram, never across geography.
 */
export function ConnectionScreen({ route, navigation }: StackProps<'Connection'>) {
  const host = world.memberById(route.params.hostId);
  const story = world.storyFor(host.id);
  const branches = world.viewerFriendNames(story.path.map((m) => m.id));
  const via = story.path.slice(1, -1).map((m) => m.name);

  const headline = story.reachable
    ? story.degrees === 1
      ? `You know ${host.name} directly`
      : `${story.degrees} steps from you`
    : `${host.name} is new to your circle`;
  const sub = story.reachable
    ? via.length ? `Through ${via.join(' and ')}` : 'A direct connection of yours'
    : 'Nobody you know has met them yet';

  const go = (fn: () => void) => () => { haptic.tap(); fn(); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nav}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>
      </View>

      <View style={styles.heroWrap}>
        <View style={[styles.hero, shadow.card]}>
          <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={92} ring />
          <Text style={styles.name}>{headline}</Text>
          <Text style={styles.sub}>{sub}</Text>
          <View style={styles.badges}>
            {story.reachable ? <TrustPill label={`${ordinal(story.degrees)} degree`} tone={story.degrees >= 3 ? 'outline' : 'tint'} /> : null}
            {story.reachable ? <TrustPill label="Verified through people" tone="outline" /> : <TrustPill label="Not yet connected" tone="outline" />}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {story.reachable ? (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>THE ROUTE</Text>
            <GraphView path={story.path} branches={branches} />
            <View style={styles.hairline} />
            <ConnectionPath path={story.path} hopNotes={story.hopNotes} />
            <Text style={styles.caption}>Kiki shows the route, not a score. Everyone on it agreed to be named.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.eyebrow}>THE ROUTE</Text>
            <Text style={styles.lead}>Nobody you know can tell you anything about {host.name} yet.</Text>
            <Text style={styles.caption}>We're not going to dress that up. Here's everything we do have instead.</Text>
          </View>
        )}

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
              <Text style={styles.primaryPrice}>{story.reachable ? `${ordinal(story.degrees)} degree${via[0] ? ` · via ${via[0]}` : ''}` : 'New to your circle'}</Text>
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

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 2 },
  back: { ...font.h3, color: color.brand },
  heroWrap: { paddingHorizontal: 18, paddingTop: 6 },
  hero: { backgroundColor: color.surface, borderRadius: radius.hero, padding: space.xl, alignItems: 'center', gap: space.sm },
  name: { ...font.h2, marginTop: space.sm, textAlign: 'center' },
  sub: { ...font.caption, textAlign: 'center' },
  badges: { flexDirection: 'row', gap: space.sm, marginTop: space.xs, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  body: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, gap: 14 },
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.hairline, borderRadius: 18, padding: 14, gap: 11 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: color.inkFaint },
  lead: { ...font.body, color: color.ink },
  caption: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
  hairline: { height: 1, backgroundColor: color.hairlineSoft },
  footnote: { ...font.caption, lineHeight: 18, color: color.inkFaint },
  footer: { backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.hairline, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22, gap: 8 },
  primaryRow: { flexWrap: 'wrap', rowGap: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryName: { fontSize: 14, fontWeight: '600', color: color.ink },
  primaryPrice: { fontSize: 12.5, color: color.inkFaint },
  primaryBtn: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 13, ...shadow.brand },
  primaryPressed: { transform: [{ scale: 0.97 }], backgroundColor: color.brandDark },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
