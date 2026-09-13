import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { TrustPill } from '../ui/TrustPill';
import { color, font, radius, space } from '../theme/tokens';
import { threads, lastDay } from '../messaging/threads';
import * as world from '../world';
import type { RootNav } from '../navigation';

/** Inbox: threads sorted by recent activity, each with its trust context. */
export function MessagesScreen() {
  const navigation = useNavigation<RootNav>();
  const ordered = [...threads].sort((a, b) => lastDay(b) - lastDay(a));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>Messages</Text>
        {ordered.map((t) => {
          const m = world.memberById(t.withId);
          const last = t.messages[t.messages.length - 1];
          const degrees = world.degreeToHost(t.withId);
          return (
            <Pressable key={t.id} style={styles.row} onPress={() => navigation.navigate('Thread', { memberId: t.withId })}>
              <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={m.country} size={50} />
              <View style={styles.meta}>
                <View style={styles.line}>
                  <Text style={styles.name}>{m.name}</Text>
                  {Number.isFinite(degrees) ? <TrustPill label={`${degrees === 1 ? '1st' : degrees === 2 ? '2nd' : degrees + 'th'} degree`} tone="tint" /> : null}
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {last.fromId === world.viewerId ? 'You: ' : ''}{last.text}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  body: { padding: space.lg, gap: space.sm },
  h1: { ...font.display, marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.surface, borderRadius: radius.md, padding: space.md },
  meta: { flex: 1, gap: 3 },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { ...font.h3, fontSize: 16 },
  preview: { ...font.body, color: color.inkSoft },
});
