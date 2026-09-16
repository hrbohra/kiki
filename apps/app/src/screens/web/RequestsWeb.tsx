import { useEffect, useState, useCallback } from 'react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { View, Text, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useResponsive } from '../../ui/useResponsive';
import { Avatar } from '../../ui/Avatar';
import { ReachPill, WEB_SHADOW } from './webBits';
import { photoFor } from '../../ui/listingPhotos';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';
import { useSession } from '../../api/session';
import { haptic } from '../../ui/feedback';
import { SlideToAccept } from '../../ui/SlideToAccept';
import type { Member } from '../../domain/types';
import type { RootNav } from '../../navigation';

interface InboxItem {
  id: string;
  guestId: string;
  nights: number;
  state: 'pending' | 'accepted' | 'declined';
  guest: Member;
}

/** Requests — the host's home screen, live from the API. Un-gamified: no timers, no reply-speed
 *  ranking, declining costs nothing. Accept/decline persists. */
export function RequestsWeb() {
  const navigation = useNavigation<RootNav>();
  const { api } = useSession();
  const focused = useIsFocused();
  const [items, setItems] = useState<InboxItem[] | null>(null);

  const load = useCallback(() => {
    api.requests.inbox.query().then((r) => setItems(r as unknown as InboxItem[])).catch(() => setItems([]));
  }, [api]);

  useEffect(() => {
    if (focused) load();
  }, [focused, load]);

  const decide = async (id: string, decision: 'accept' | 'decline') => {
    if (decision === 'accept') haptic.success(); else haptic.tap();
    setItems((prev) => prev?.map((x) => (x.id === id ? { ...x, state: decision === 'accept' ? 'accepted' : 'declined' } : x)) ?? null);
    try {
      await api.requests.decide.mutate({ requestId: id, decision });
    } finally {
      load();
    }
  };

  const visible = (items ?? []).filter((r) => r.state !== 'declined');
  const needs = visible.filter((r) => r.state === 'pending').length;

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={styles.h1}>Requests</Text>
        <Text style={styles.sub}>People asking to stay in your place. {needs} need{needs === 1 ? 's' : ''} a reply.</Text>
      </View>

      <View style={styles.cols}>
        <View style={styles.list}>
          {items === null ? (
            <View style={styles.loading}><ActivityIndicator color={color.brand} /></View>
          ) : visible.length === 0 ? (
            <Text style={styles.empty}>No requests right now.</Text>
          ) : (
            visible.map((r) => (
              <RequestCard
                key={r.id}
                item={r}
                onOpen={() => navigation.navigate('Trust', { hostId: r.guestId, as: 'host', requestId: r.id })}
                onDecide={decide}
              />
            ))
          )}
        </View>

        <View style={styles.rail}>
          <View style={styles.caution}>
            <View style={styles.cautionRule} />
            <Text style={styles.cautionHeading}>No timers here</Text>
            <Text style={styles.cautionBody}>Kiki does not count down on a request or rank you for replying fast. Read the page, ask the mutual, and answer when you actually know.</Text>
          </View>
          <View style={[styles.card, styles.railCard]}>
            <Text style={styles.railTitle}>Before you say yes</Text>
            <Text style={styles.railBody}>Open the guest side of their trust page. Hosting reviews tell you how someone keeps their own flat, not how they will keep yours.</Text>
            <Text style={styles.railFoot}>Declining costs you nothing. It is not recorded on your standing.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function RequestCard({ item, onOpen, onDecide }: { item: InboxItem; onOpen: () => void; onDecide: (id: string, d: 'accept' | 'decline') => void }) {
  const { isWide } = useResponsive();
  const person = item.guest;
  const guestListing = world.listingForHost(person.id);
  const steps = world.degreeToHost(person.id);
  const needs = item.state === 'pending';
  const story = world.trustStoryFor(person.id);
  const line = story.warm && story.channels[0]
    ? `${story.channels[0].voucher.name} vouches for them.`
    : story.inviter
      ? `Nobody you know has met them — ${story.inviter.member.name} invited them in.`
      : 'A new face in the network.';

  return (
    <View style={[styles.reqCard, WEB_SHADOW]}>
      {needs ? <View style={styles.needsRule} /> : null}
      {guestListing ? <Image source={photoFor(guestListing.id)} style={[styles.reqPhoto, !isWide && styles.reqPhotoPhone]} resizeMode="cover" /> : null}
      <View style={styles.reqBody}>
        <View style={styles.reqTop}>
          <Avatar id={person.id} name={person.name} tint={person.avatarColor} country={person.country} size={34} />
          <Text style={styles.reqName}>{person.name}</Text>
          {Number.isFinite(steps) ? <ReachPill deg={steps} /> : null}
          <View style={{ flex: 1 }} />
          <View style={[styles.statusPill, needs ? styles.statusNeeds : styles.statusWaiting]}>
            <Text style={[styles.statusText, needs ? styles.statusTextNeeds : styles.statusTextWaiting]}>{needs ? 'Needs your reply' : 'Confirmed'}</Text>
          </View>
        </View>
        <Text style={styles.reqDates}>{item.nights} nights</Text>
        <Text style={styles.reqLine}>{line}</Text>
        <View style={styles.reqFoot}>
          <Pressable onPress={onOpen}><Text style={styles.reqLink}>Read their trust page ›</Text></Pressable>
          <View style={{ flex: 1 }} />
          {needs ? (
            !isWide ? (
              /* Weight on the yes, nothing on the no (Sep 2/3): a deliberate slide to accept, a quiet link to decline. */
              <View style={styles.slideWrap}>
                <SlideToAccept name={person.name} onCommit={() => setTimeout(() => onDecide(item.id, 'accept'), 900)} />
                <Pressable hitSlop={10} onPress={() => onDecide(item.id, 'decline')} accessibilityRole="button" style={styles.declineLinkWrap}>
                  <Text style={styles.declineLink}>Decline</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable onPress={() => onDecide(item.id, 'decline')} style={({ hovered }: any) => [styles.declineBtn, hovered && styles.declineHover]}>
                  <Text style={styles.declineText}>Decline</Text>
                </Pressable>
                <Pressable onPress={() => onDecide(item.id, 'accept')} style={({ hovered }: any) => [styles.acceptBtn, hovered && styles.acceptHover]}>
                  <Text style={styles.acceptText}>Accept</Text>
                </Pressable>
              </View>
            )
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, color: color.ink },
  sub: { fontSize: 14, color: color.inkFaint, marginTop: 4 },
  cols: { flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },
  list: { flexGrow: 1, flexShrink: 1, flexBasis: 560, minWidth: 0, gap: 14 },
  rail: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minWidth: 0, gap: 16 },
  loading: { paddingVertical: 40, alignItems: 'center' },
  empty: { fontSize: 14.5, color: color.inkSoft, paddingVertical: 24 },

  reqCard: { flexDirection: 'row', backgroundColor: color.surface, borderRadius: 20, overflow: 'hidden' },
  needsRule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.brand, zIndex: 1 },
  reqPhoto: { width: 150, height: '100%', minHeight: 150 },
  reqPhotoPhone: { width: 110, minHeight: 120 },
  reqBody: { flex: 1, padding: 18, gap: 8 },
  reqTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  reqName: { fontSize: 17, fontWeight: '700', color: color.ink },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  statusNeeds: { backgroundColor: color.brandTint },
  statusWaiting: { backgroundColor: color.bg },
  statusText: { fontSize: 12.5, fontWeight: '700' },
  statusTextNeeds: { color: color.textOnMint },
  statusTextWaiting: { color: color.inkFaint },
  reqDates: { fontSize: 13.5, color: color.inkSoft },
  reqLine: { fontSize: 14.5, lineHeight: 21, color: color.ink },
  reqFoot: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2, gap: 12 },
  reqLink: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
  actions: { flexDirection: 'row', gap: 8 },
  slideWrap: { flexBasis: '100%', gap: 4, marginTop: 4 },
  declineLinkWrap: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 10 },
  declineLink: { fontSize: 13.5, fontWeight: '600', color: color.inkFaint },
  declineBtn: { borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: color.bg, borderWidth: 1, borderColor: color.hairline },
  declineHover: { backgroundColor: color.hairline },
  declineText: { fontSize: 13, fontWeight: '700', color: color.inkFaint },
  acceptBtn: { borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: color.brand },
  acceptHover: { opacity: 0.9 },
  acceptText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  card: { backgroundColor: color.surface, borderRadius: 20, ...WEB_SHADOW },
  caution: { backgroundColor: color.surface, borderRadius: 20, padding: 20, paddingLeft: 23, gap: 8, overflow: 'hidden', ...WEB_SHADOW },
  cautionRule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  cautionHeading: { fontSize: 13.5, fontWeight: '700', color: color.caveat },
  cautionBody: { fontSize: 14.5, lineHeight: 21, color: color.ink },
  railCard: { padding: 20, gap: 10 },
  railTitle: { fontSize: 16, fontWeight: '700', color: color.ink },
  railBody: { fontSize: 14.5, lineHeight: 21, color: color.inkSoft },
  railFoot: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
});
