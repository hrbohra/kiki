import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { WebModal } from './WebModal';
import { RouteGraph } from '../../ui/RouteGraph';
import { RouteList } from '../../ui/RouteList';
import { haptic } from '../../ui/feedback';
import { color } from '../../theme/tokens';
import * as world from '../../world';
import type { RootNav } from '../../navigation';

/** The routes as a modal on the desktop: every shortest route drawn and weighted, the list in
 *  words beside it, and the graph's own action — ask the mutual first. */
export function GraphModal({ hostId, onClose }: { hostId: string; onClose: () => void }) {
  const navigation = useNavigation<RootNav>();
  const story = world.trustStoryFor(hostId);
  const host = story.host;
  const viewer = world.memberById(world.viewerId);
  const routes = story.rankedRoutes;
  const others = world.viewerFriendNames(routes.flatMap((r) => r.members.map((m) => m.id)));
  const mutual = routes[0] && routes[0].members.length > 2 ? routes[0].members[1] : null;
  const first = (m: { name: string }) => m.name.split(' ')[0];
  const sub = !story.reachable
    ? `Nobody links you to ${first(host)} yet — here's where they'd sit relative to you.`
    : story.direct
      ? `You know ${first(host)} yourself — the shortest route there is.`
      : routes.length === 1
        ? `One route, through ${routes[0].members.slice(1, -1).map(first).join(' and ')}.`
        : `${routes.length} routes. ${routes.length === 2 ? 'Both' : 'All'} through people you can call.`;

  return (
    <WebModal width={640} onClose={onClose}>
      <Text style={styles.title}>How you're connected to {first(host)}</Text>
      <Text style={styles.sub}>{sub}</Text>
      <View style={{ height: 14 }} />
      <RouteGraph viewer={viewer} host={host} routes={routes} otherPeople={others} nextRingCount={story.nextRingCount} reachable={story.reachable} direct={story.direct} />
      {routes.length ? (<><View style={{ height: 16 }} /><RouteList story={story} /></>) : null}
      <Text style={styles.caveat}>Thick line, strong tie. Kiki shows the route, not a score{story.consentNames.length ? '; everyone drawn agreed to be named' : ''}.</Text>
      {mutual ? (
        <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={() => { haptic.tap(); onClose(); navigation.navigate('Thread', { memberId: mutual.id }); }} accessibilityRole="button">
          <Text style={styles.btnText}>Ask {first(mutual)}</Text>
        </Pressable>
      ) : null}
    </WebModal>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 19, lineHeight: 26, fontWeight: '700', color: color.ink, paddingRight: 32 },
  sub: { fontSize: 14, color: color.inkSoft, marginTop: 4 },
  caveat: { fontSize: 13, color: color.inkFaint, marginTop: 16, lineHeight: 19 },
  btn: { alignSelf: 'flex-start', marginTop: 16, backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  btnPressed: { transform: [{ scale: 0.97 }], backgroundColor: color.brandDark },
  btnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
});
