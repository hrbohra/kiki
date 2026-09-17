import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { TieMeter } from './trust/TieMeter';
import { color } from '../theme/tokens';
import type { RouteView, TrustStory } from '../domain/types';

/**
 * The routes in words: the picture's accessible twin. One row per route (the two strongest), the
 * chain as "Nina → Maia", the sentence that produced the first hop's weight, and the three-bar
 * meter that already lives on the Trust page. Never a number.
 */
export function RouteList({ story, max = 2 }: { story: TrustStory; max?: number }) {
  const routes = story.rankedRoutes;
  if (!routes.length) return null;
  const rest = routes.length - Math.min(max, routes.length);
  const reasonFor = (route: RouteView): string => {
    const first = route.members[1];
    const channel = story.channels.find((c) => c.voucher.id === first?.id);
    if (channel) return `${channel.tie.reason}${channel.note ? ` “${channel.note}”` : ''}`;
    if (route.members.length === 2) return story.directLink?.tie.reason ?? 'You know them yourself.';
    const via = route.members.slice(1, -1).map((m) => m.name.split(' ')[0]);
    return route.dashed[0] ? `You and ${via[0]} are connected, but nothing is measured on that tie yet.` : `Through ${via.join(', then ')}.`;
  };

  return (
    <View style={styles.list} accessible accessibilityRole="list">
      {routes.slice(0, max).map((r) => {
        const chain = r.members.slice(1);
        const lead = r.members.length === 2 ? story.host : r.members[1];
        return (
          <View key={r.members.map((m) => m.id).join('-')} style={styles.row} accessibilityLabel={`${chain.map((m) => m.name.split(' ')[0]).join(', then ')}. ${reasonFor(r)}`}>
            <Avatar id={lead.id} name={lead.name} tint={lead.avatarColor} size={36} />
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={styles.chain} numberOfLines={1}>
                {chain.map((m, i) => (
                  <Text key={m.id}>{i > 0 ? <Text style={styles.arrow}> → </Text> : null}{m.name.split(' ')[0]}</Text>
                ))}
              </Text>
              <Text style={styles.sentence}>{reasonFor(r)}</Text>
            </View>
            <TieMeter strength={r.strengths[0] ?? 1} />
          </View>
        );
      })}
      {rest > 0 ? <Text style={styles.more}>and {rest} more {rest === 1 ? 'way' : 'ways'}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chain: { fontSize: 14, fontWeight: '700', color: color.ink },
  arrow: { color: color.inkFaint, fontWeight: '600' },
  sentence: { fontSize: 12.5, lineHeight: 18, color: color.inkSoft },
  more: { fontSize: 12.5, fontWeight: '600', color: color.inkFaint },
});
