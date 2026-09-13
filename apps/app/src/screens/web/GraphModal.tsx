import { View, Text, StyleSheet } from 'react-native';
import { WebModal } from './WebModal';
import { GraphView } from '../../ui/GraphView';
import { ConnectionPath } from '../../ui/ConnectionPath';
import { color } from '../../theme/tokens';
import * as world from '../../world';

/** The route as a modal: the graph, the chain, and the reminder that this is a route and not a
 *  score. Reachable via "How you're connected / View the route" on any person. */
export function GraphModal({ hostId, onClose }: { hostId: string; onClose: () => void }) {
  const story = world.trustStoryFor(hostId);
  const host = story.host;
  const viewer = world.memberById(world.viewerId);

  const ch = story.channels[0];
  const path = ch ? [viewer, ch.voucher, host] : story.direct ? [viewer, host] : [viewer, host];
  const hopNotes = ch ? [ch.note, undefined] : story.direct ? [story.directLink?.note] : [undefined];
  const sub = story.reachable
    ? story.direct
      ? `You know ${host.name} yourself — the shortest route there is.`
      : `${story.channels.length} ${story.channels.length === 1 ? 'person' : 'people'} link you to ${host.name}${story.channels[0] ? `, starting with ${story.channels[0].voucher.name}` : ''}.`
    : `Nobody links you to ${host.name} yet — here's where they'd sit relative to you.`;

  return (
    <WebModal width={620} onClose={onClose}>
      <Text style={styles.title}>How you're connected to {host.name}</Text>
      <Text style={styles.sub}>{sub}</Text>
      <View style={{ height: 12 }} />
      <GraphView path={path} />
      <View style={{ height: 12 }} />
      <ConnectionPath path={path} hopNotes={hopNotes} />
      <Text style={styles.caveat}>Kiki shows the route, not a score. {story.consentNames.length ? 'Both of these people agreed to be named.' : ''}</Text>
    </WebModal>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 19, lineHeight: 26, fontWeight: '700', color: color.ink, paddingRight: 32 },
  sub: { fontSize: 14, color: color.inkSoft, marginTop: 4 },
  caveat: { fontSize: 13, color: color.inkFaint, marginTop: 16, lineHeight: 19 },
});
