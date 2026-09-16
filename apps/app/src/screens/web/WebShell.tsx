import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Loop } from '../../ui/Loop';
import { Avatar } from '../../ui/Avatar';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';
import { ExploreWeb } from './ExploreWeb';
import { RequestsWeb } from './RequestsWeb';
import { CommunityWeb } from './CommunityWeb';
import { GuestBookWeb } from './GuestBookWeb';
import { TripsWeb } from './TripsWeb';
import { MessagesWeb } from './MessagesWeb';
import { MeWeb } from './MeWeb';
import { useSession } from '../../api/session';

export type WebPage = 'explore' | 'requests' | 'community' | 'guestbook' | 'trips' | 'messages' | 'me';
const TABS: { key: WebPage; label: string }[] = [
  { key: 'explore', label: 'Explore' },
  { key: 'requests', label: 'Requests' },
  { key: 'community', label: 'Community' },
  { key: 'guestbook', label: 'Guest book' },
  { key: 'trips', label: 'Trips' },
  { key: 'messages', label: 'Messages' },
  { key: 'me', label: 'Me' },
];

/**
 * The desktop web shell: one sticky header with real tab navigation, shared by every page.
 * On a wide viewport this replaces the phone bottom-tab bar. Detail screens (a host's profile,
 * the Trust tab, a thread) still push over it through the stack navigator.
 */
export function WebShell() {
  const [page, setPage] = useState<WebPage>('explore');
  const viewer = world.memberById(world.viewerId);
  const { api } = useSession();
  const [needsReply, setNeedsReply] = useState(0);
  useEffect(() => {
    let alive = true;
    api.requests.inbox.query()
      .then((r) => { if (alive) setNeedsReply((r as { state: string }[]).filter((x) => x.state === 'pending').length); })
      .catch(() => {});
    return () => { alive = false; };
  }, [api, page]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.wordmark}>
            <Loop size={30} color={color.brand} opacity={1} strokeWidth={9} />
            <Text style={styles.brand}>Kiki</Text>
          </View>
          <View style={styles.tabs}>
            {TABS.map((t) => (
              <Pressable key={t.key} style={[styles.tab, page === t.key && styles.tabActive]} onPress={() => setPage(t.key)} accessibilityRole="button">
                <Text style={[styles.tabText, page === t.key && styles.tabTextActive]}>{t.label}</Text>
                {t.key === 'requests' && needsReply > 0 ? (
                  <View style={styles.badge}><Text style={styles.badgeText}>{needsReply}</Text></View>
                ) : null}
              </Pressable>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.you} onPress={() => setPage('me')} accessibilityRole="button" accessibilityLabel="You">
            <Avatar id={viewer.id} name={viewer.name} tint={viewer.avatarColor} size={30} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          {page === 'explore' && <ExploreWeb />}
          {page === 'requests' && <RequestsWeb />}
          {page === 'community' && <CommunityWeb />}
          {page === 'guestbook' && <GuestBookWeb />}
          {page === 'trips' && <TripsWeb />}
          {page === 'messages' && <MessagesWeb />}
          {page === 'me' && <MeWeb />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.screen },
  header: { height: 66, backgroundColor: 'rgba(255,255,255,0.94)', borderBottomWidth: 1, borderBottomColor: color.hairline, zIndex: 30 },
  headerInner: { flex: 1, maxWidth: 1560, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 24, paddingHorizontal: 40 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  tabs: { flexDirection: 'row', height: '100%' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, height: '100%', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: color.ink },
  tabText: { fontSize: 14.5, fontWeight: '600', color: color.inkFaint },
  tabTextActive: { fontWeight: '700', color: color.ink },
  badge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  you: {},
  scroll: { paddingBottom: 96 },
  shell: { maxWidth: 1560, width: '100%', alignSelf: 'center', paddingHorizontal: 40, paddingTop: 36 },
});
