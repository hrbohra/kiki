import { useEffect, useState } from 'react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { TrustPill } from '../ui/TrustPill';
import { color, font, radius, space } from '../theme/tokens';
import * as world from '../world';
import { useSession } from '../api/session';
import type { RootNav } from '../navigation';

interface ThreadRow {
  id: string;
  other: { id: string; name: string; avatarColor: string; country: string };
  lastMessage: { text: string; senderId: string } | null;
  unread: number;
}

/** Inbox: threads from the live API, sorted by recent activity, each with its trust context. */
export function MessagesScreen() {
  const navigation = useNavigation<RootNav>();
  const { api } = useSession();
  const focused = useIsFocused();
  const [rows, setRows] = useState<ThreadRow[] | null>(null);

  useEffect(() => {
    if (!focused) return;
    let alive = true;
    api.messaging.threads.query().then((t) => alive && setRows(t as ThreadRow[])).catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [api, focused]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>Messages</Text>
        {rows === null ? (
          <View style={styles.loading}><ActivityIndicator color={color.brand} /></View>
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>No conversations yet.</Text>
        ) : (
          rows.map((t) => {
            const m = t.other;
            const degrees = world.degreeToHost(m.id);
            return (
              <Pressable key={t.id} style={styles.row} onPress={() => navigation.navigate('Thread', { memberId: m.id })}>
                <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={m.country} size={50} />
                <View style={styles.meta}>
                  <View style={styles.line}>
                    <Text style={styles.name}>{m.name}</Text>
                    {Number.isFinite(degrees) ? <TrustPill label={`${degrees === 1 ? '1st' : degrees === 2 ? '2nd' : degrees + 'th'} degree`} tone="tint" /> : null}
                    {t.unread > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{t.unread}</Text></View> : null}
                  </View>
                  <Text style={styles.preview} numberOfLines={1}>
                    {t.lastMessage ? `${t.lastMessage.senderId === world.viewerId ? 'You: ' : ''}${t.lastMessage.text}` : 'Say hello'}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  body: { padding: space.lg, gap: space.sm },
  h1: { ...font.display, marginBottom: space.sm },
  loading: { paddingVertical: space.xl, alignItems: 'center' },
  empty: { ...font.body, color: color.inkSoft, textAlign: 'center', marginTop: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.surface, borderRadius: radius.md, padding: space.md },
  meta: { flex: 1, gap: 3 },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { ...font.h3, fontSize: 16 },
  preview: { ...font.body, color: color.inkSoft },
  unread: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
