import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { TierBadge } from '../ui/TierBadge';
import { TRAIT_GLYPH } from '../ui/glyphs';
import { color, font, radius, space, shadow } from '../theme/tokens';
import { threadWith } from '../messaging/threads';
import * as world from '../world';
import type { StackProps } from '../navigation';

/** A chat thread with a trust-context header you can glance at mid-conversation. */
export function ThreadScreen({ route, navigation }: StackProps<'Thread'>) {
  const member = world.memberById(route.params.memberId);
  const thread = threadWith(member.id);
  const story = world.storyFor(member.id);
  const standing = world.standingOf(member.id);
  const context = story.reachable
    ? `${story.degrees === 1 ? 'Direct friend' : `${story.degrees}${story.degrees === 2 ? 'nd' : 'th'} degree`}${story.path[1] ? ` · via ${story.path[1].name}` : ''}`
    : 'New connection';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, shadow.card]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Avatar id={member.id} name={member.name} tint={member.avatarColor} country={member.country} size={38} />
        <View style={styles.headMeta}>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.context}>{context}</Text>
        </View>
        <TierBadge standing={standing} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {story.overlaps[0] ? (
          <View style={styles.contextCard}>
            {(() => { const G = TRAIT_GLYPH[story.overlaps[0].kind]; return <G size={16} color={color.textOnMint} accent={color.brand} surface={color.brandTint} />; })()}
            <Text style={styles.contextText}>{story.overlaps[0].label}</Text>
          </View>
        ) : null}

        {thread ? (
          thread.messages.map((msg) => {
            const mine = msg.fromId === world.viewerId;
            return (
              <View key={msg.id} style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.mine : [styles.theirs, shadow.card]]}>
                  <Text style={[styles.msgText, mine && styles.msgTextMine]}>{msg.text}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.empty}>Say hello to {member.name}.</Text>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <View style={styles.input}><Text style={styles.inputPlaceholder}>Message {member.name}…</Text></View>
        <View style={styles.send}><Text style={styles.sendArrow}>↑</Text></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: color.surface, borderBottomWidth: 1, borderBottomColor: color.hairline, zIndex: 2 },
  back: { fontSize: 28, color: color.brand, fontWeight: '700' },
  headMeta: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: color.ink },
  context: { fontSize: 13, fontWeight: '600', color: color.textOnMint },
  body: { padding: space.lg, gap: space.sm },
  contextCard: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.brandTint, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm, alignSelf: 'center', marginBottom: space.sm },
  contextText: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 11 },
  mine: { backgroundColor: color.brand, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: color.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 6, borderBottomRightRadius: 18, borderWidth: 1, borderColor: color.hairline },
  msgText: { fontSize: 15, fontWeight: '500', color: color.ink, lineHeight: 22 },
  msgTextMine: { color: '#FFFFFF' },
  empty: { ...font.body, textAlign: 'center', marginTop: space.xl },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderTopWidth: 1, borderTopColor: color.hairline, backgroundColor: color.surface },
  input: { flex: 1, backgroundColor: color.bg, borderRadius: radius.pill, borderWidth: 1, borderColor: color.hairline, paddingHorizontal: space.lg, paddingVertical: 13 },
  inputPlaceholder: { ...font.body, color: color.inkFaint },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  sendArrow: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: -2 },
});
