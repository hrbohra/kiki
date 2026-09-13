import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { GraphView } from '../ui/GraphView';
import { ConnectionPath } from '../ui/ConnectionPath';
import { OverlapList } from '../ui/OverlapList';
import { Avatar } from '../ui/Avatar';
import { color, font, radius, space, shadow } from '../theme/tokens';
import * as world from '../world';
import type { StackProps } from '../navigation';

/** "How you know this host": answered in three descending scales — sentence, picture, evidence. */
export function ConnectionScreen({ route, navigation }: StackProps<'Connection'>) {
  const host = world.memberById(route.params.hostId);
  const story = world.storyFor(host.id);
  const branches = world.viewerFriendNames(story.path.map((m) => m.id));

  const headline = story.reachable
    ? story.degrees === 1
      ? `You know ${host.name} directly`
      : `${story.degrees} people connect you to ${host.name}`
    : `${host.name} is new to your circle`;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.heroTop}>
          <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={60} ring />
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.check}>
            {story.reachable ? '✓ Verified through mutual friends' : 'Connect to unlock trust'}
          </Text>
        </View>

        {story.reachable ? (
          <>
            <GraphView path={story.path} branches={branches} />
            <ConnectionPath path={story.path} hopNotes={story.hopNotes} />
          </>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What you have in common</Text>
          <OverlapList overlaps={story.overlaps} />
        </View>

        <Text style={styles.footnote}>
          Overlaps are surfaced by Kiki's mutual-friend model, trained on real conversations. In
          this prototype they're matched on shared profile facts; the pipeline that turns raw
          chats into these signals is the production step.
        </Text>

        <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={() => navigation.navigate('Thread', { memberId: host.id })}>
          <Text style={styles.ctaText}>Message {host.name}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  navbar: { paddingHorizontal: space.screen, paddingVertical: space.md },
  back: { ...font.h3, color: color.brand },
  body: { padding: space.screen, paddingBottom: space.xxl, gap: space.lg },
  heroTop: { alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  headline: { ...font.h1, textAlign: 'center' },
  check: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
  section: { gap: space.md },
  sectionTitle: { ...font.h3 },
  footnote: { ...font.caption, lineHeight: 18, color: color.inkFaint },
  cta: { backgroundColor: color.brand, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', ...shadow.brand },
  ctaPressed: { backgroundColor: color.brandDark },
  ctaText: { ...font.button },
});
