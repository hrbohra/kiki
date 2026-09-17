import { useCallback, useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../ui/Avatar';
import { haptic } from '../ui/feedback';
import { useResponsive } from '../ui/useResponsive';
import { useSession } from '../api/session';
import { buildNotices, type InboxRequest, type Notice } from '../domain/notifications';
import { color, shadow } from '../theme/tokens';
import type { StackProps } from '../navigation';

/**
 * Notifications (17 Sep handoff, 2c): a refinement, not a redesign. NEEDS YOU on top with the
 * action inline, identical listing alerts grouped into one row, copy that says the fact once
 * with the degree. Read state is local to the session — the demo has no notification store.
 */
export function NotificationsScreen({ navigation }: StackProps<'Notifications'>) {
  const { api } = useSession();
  const { isWide } = useResponsive();
  const focused = useIsFocused();
  const [inbox, setInbox] = useState<InboxRequest[] | null>(null);
  const [read, setRead] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    api.requests.inbox.query().then((r) => setInbox(r as unknown as InboxRequest[])).catch(() => setInbox([]));
  }, [api]);
  useEffect(() => { if (focused) load(); }, [focused, load]);

  const notices = buildNotices(inbox ?? []);
  const sections: { key: Notice['section']; label: string }[] = [
    { key: 'needs', label: 'NEEDS YOU' },
    { key: 'today', label: 'TODAY' },
    { key: 'earlier', label: 'YESTERDAY' },
  ];

  const go = (n: Notice) => {
    if (!n.action) return;
    haptic.tap();
    const to = n.action.to;
    if (to.screen === 'Trust') navigation.navigate('Trust', { hostId: to.hostId, as: 'host', requestId: to.requestId });
    else if (to.screen === 'GuestBook') navigation.navigate('GuestBook', { hostId: to.hostId });
    else navigation.popToTop();
  };
  const markAll = () => { haptic.select(); setRead(new Set(notices.map((n) => n.id))); };
  const later = (id: string) => { haptic.select(); setRead((s) => new Set(s).add(id)); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.body, isWide && styles.bodyWide]} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back"><Text style={styles.back}>‹  Back</Text></Pressable>
          <View style={{ flex: 1 }} />
          <Pressable onPress={markAll} hitSlop={8} accessibilityRole="button"><Text style={styles.markAll}>Mark all as read</Text></Pressable>
        </View>
        <Text style={styles.h1}>Notifications</Text>

        {inbox === null ? (
          <View style={styles.skeletons}>{[0, 1, 2].map((i) => <View key={i} style={styles.skeleton} />)}</View>
        ) : notices.length === 0 ? (
          <Text style={styles.empty}>Nothing needs you. That’s allowed.</Text>
        ) : (
          sections.map((sec) => {
            const rows = notices.filter((n) => n.section === sec.key && !(sec.key === 'needs' && read.has(n.id)));
            if (!rows.length) return null;
            return (
              <View key={sec.key} style={styles.section}>
                <Text style={styles.eyebrow}>{sec.label}</Text>
                {rows.map((n) => (sec.key === 'needs' ? (
                  <View key={n.id} style={[styles.needsCard, shadow.card]} accessible accessibilityLabel={`${n.title}. ${n.body}`}>
                    <View style={styles.needsRule} />
                    <View style={styles.rowTop}>
                      {n.memberId ? <Avatar id={n.memberId} name={n.title} tint={color.brand} size={48} /> : null}
                      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                        <Text style={styles.title}>{n.title}</Text>
                        <Text style={styles.bodyText}>{n.body}</Text>
                        <Text style={styles.when}>{n.when}</Text>
                      </View>
                    </View>
                    <View style={styles.actions}>
                      {n.action ? <Pressable style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]} onPress={() => go(n)} accessibilityRole="button"><Text style={styles.primaryText}>{n.action.label}</Text></Pressable> : null}
                      {n.secondary ? <Pressable style={styles.secondary} onPress={() => later(n.id)} accessibilityRole="button"><Text style={styles.secondaryText}>{n.secondary}</Text></Pressable> : null}
                    </View>
                  </View>
                ) : (
                  <Pressable key={n.id} style={[styles.row, read.has(n.id) && { opacity: 0.6 }]} onPress={() => go(n)} accessibilityRole={n.action ? 'button' : 'text'} accessibilityLabel={`${n.title}. ${n.body}`}>
                    {n.memberId ? (
                      <Avatar id={n.memberId} name={n.title} tint={color.brand} size={44} />
                    ) : (
                      <View style={styles.countTile}><Text style={styles.countText}>{n.count ?? ''}</Text></View>
                    )}
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={styles.title}>{n.title}</Text>
                      <Text style={styles.bodyText}>{n.body}</Text>
                      <Text style={styles.when}>{n.when}</Text>
                    </View>
                  </Pressable>
                )))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  body: { padding: 16, paddingBottom: 40, gap: 14 },
  bodyWide: { maxWidth: 680, width: '100%', alignSelf: 'center', paddingTop: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  back: { fontSize: 15, fontWeight: '700', color: color.brand },
  markAll: { fontSize: 14, fontWeight: '600', color: color.brand },
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, color: color.ink },
  skeletons: { gap: 10 },
  skeleton: { height: 72, borderRadius: 18, backgroundColor: color.hairlineSoft },
  empty: { fontSize: 15, color: color.inkSoft },
  section: { gap: 10 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: color.inkFaint, marginTop: 4 },
  needsCard: { backgroundColor: color.surface, borderRadius: 18, padding: 14, paddingLeft: 17, gap: 12, overflow: 'hidden' },
  needsRule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.brand },
  rowTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '700', color: color.ink },
  bodyText: { fontSize: 13.5, lineHeight: 19, color: color.inkSoft },
  when: { fontSize: 12, color: color.inkFaint },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  primary: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  primaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  secondary: { borderWidth: 1.5, borderColor: color.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  secondaryText: { fontSize: 14, fontWeight: '700', color: color.inkSoft },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: color.surface, borderRadius: 18, borderWidth: 1, borderColor: color.hairline, paddingVertical: 12, paddingHorizontal: 14 },
  countTile: { width: 44, height: 44, borderRadius: 12, backgroundColor: color.brandTint, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 16, fontWeight: '700', color: color.textOnMint },
});
