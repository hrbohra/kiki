import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { ReachPill, WEB_SHADOW } from './webBits';
import { photoFor } from '../../ui/listingPhotos';
import { REQUESTS, requestsNeedingReply, type StayRequest } from '../../domain/requests';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';
import type { RootNav } from '../../navigation';

/** Requests — the host's home screen: who is asking to stay, and what you know about them.
 *  Deliberately un-gamified: no timers, no reply-speed ranking, declining costs nothing. */
export function RequestsWeb() {
  const navigation = useNavigation<RootNav>();
  const needs = requestsNeedingReply();

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={styles.h1}>Requests</Text>
        <Text style={styles.sub}>People asking to stay in your place. {needs} need{needs === 1 ? 's' : ''} a reply.</Text>
      </View>

      <View style={styles.cols}>
        <View style={styles.list}>
          {REQUESTS.map((r) => <RequestCard key={r.id} req={r} onOpen={() => navigation.navigate('Trust', { hostId: r.personId })} />)}
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

function RequestCard({ req, onOpen }: { req: StayRequest; onOpen: () => void }) {
  const person = world.memberById(req.personId);
  const listing = world.listingForHost(req.personId);
  const needs = req.state === 'needs';

  return (
    <Pressable style={({ hovered }: any) => [styles.reqCard, WEB_SHADOW, hovered && styles.reqHover]} onPress={onOpen} accessibilityRole="button">
      {needs ? <View style={styles.needsRule} /> : null}
      {listing ? <Image source={photoFor(listing.id)} style={styles.reqPhoto} resizeMode="cover" /> : null}
      <View style={styles.reqBody}>
        <View style={styles.reqTop}>
          <Avatar id={person.id} name={person.name} tint={person.avatarColor} country={person.country} size={34} />
          <Text style={styles.reqName}>{person.name}</Text>
          <ReachPill deg={req.steps} />
          <View style={{ flex: 1 }} />
          <View style={[styles.statusPill, needs ? styles.statusNeeds : styles.statusWaiting]}>
            <Text style={[styles.statusText, needs ? styles.statusTextNeeds : styles.statusTextWaiting]}>{needs ? 'Needs your reply' : 'Waiting on them'}</Text>
          </View>
        </View>
        <Text style={styles.reqDates}>{req.dates} · {req.nights} nights</Text>
        <Text style={styles.reqLine}>{req.line}</Text>
        <View style={styles.reqFoot}>
          <Text style={styles.reqAge}>{req.age}</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.reqLink}>Read their trust page ›</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, color: color.ink },
  sub: { fontSize: 14, color: color.inkFaint, marginTop: 4 },
  cols: { flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },
  list: { flexGrow: 1, flexBasis: 560, minWidth: 320, gap: 14 },
  rail: { flexGrow: 1, flexBasis: 300, minWidth: 280, gap: 16 },

  reqCard: { flexDirection: 'row', backgroundColor: color.surface, borderRadius: 20, overflow: 'hidden' },
  reqHover: { transform: [{ translateY: -2 }] },
  needsRule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.brand, zIndex: 1 },
  reqPhoto: { width: 150, height: '100%', minHeight: 150 },
  reqBody: { flex: 1, padding: 18, gap: 8 },
  reqTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reqName: { fontSize: 17, fontWeight: '700', color: color.ink },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  statusNeeds: { backgroundColor: color.brandTint },
  statusWaiting: { backgroundColor: color.bg },
  statusText: { fontSize: 12.5, fontWeight: '700' },
  statusTextNeeds: { color: color.textOnMint },
  statusTextWaiting: { color: color.inkFaint },
  reqDates: { fontSize: 13.5, color: color.inkSoft },
  reqLine: { fontSize: 14.5, lineHeight: 21, color: color.ink },
  reqFoot: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  reqAge: { fontSize: 12.5, color: color.inkFaint },
  reqLink: { fontSize: 13, fontWeight: '700', color: color.textOnMint },

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
