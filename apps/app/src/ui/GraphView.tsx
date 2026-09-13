import { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Line, Circle, G } from 'react-native-svg';
import { Avatar } from './Avatar';
import { color, radius, shadow, space } from '../theme/tokens';
import type { Member } from '../domain/types';

interface Props {
  path: Member[]; // viewer ... host
  branches?: string[]; // other 1-hop friends, drawn as faint stubs (no labels)
}

interface Pt { x: number; y: number }
const H = 180;

/**
 * A network view of the trust path: quadratic edges on an alternating baseline turn a diagram
 * into a route. Rendered statically (no animation) so it paints reliably on iOS and web —
 * curved edges + gradient nodes carry the meaning without motion.
 */
export function GraphView({ path, branches = [] }: Props) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const n = path.length;
  const nodes: Pt[] = path.map((_, i) => ({
    x: n === 1 ? w / 2 : 34 + (i / (n - 1)) * (w - 68),
    y: i % 2 === 0 ? 104 : 58,
  }));
  const midIndex = Math.floor(n / 2);
  const nodeSize = (i: number) => (i === n - 1 ? 58 : n > 4 ? 42 : 48);

  return (
    <View style={[styles.card, { height: H + 36 }]} onLayout={onLayout}>
      {w > 0 ? (
        <>
          <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
            {/* faint branch stubs off the middle node */}
            {branches.slice(0, 3).map((_, i) => {
              const from = nodes[midIndex] ?? nodes[0];
              const angle = Math.PI * (0.62 + i * 0.28);
              const to = { x: from.x + Math.cos(angle) * 30, y: from.y + Math.sin(angle) * 26 + 22 };
              return (
                <G key={`stub-${i}`}>
                  <Line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#DCE5E1" strokeWidth={1.6} />
                  <Circle cx={to.x} cy={to.y} r={4} fill="#DCE5E1" />
                </G>
              );
            })}
            {/* path edges: quadratic curves lifted above the midpoint */}
            {nodes.slice(1).map((p, i) => {
              const a = nodes[i];
              const cx = (a.x + p.x) / 2;
              const cy = Math.min(a.y, p.y) - 26;
              return (
                <Path
                  key={`edge-${i}`}
                  d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${p.x} ${p.y}`}
                  stroke={color.trust1}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })}
          </Svg>

          {/* nodes as gradient avatars */}
          {path.map((m, i) => {
            const p = nodes[i];
            const size = nodeSize(i);
            return (
              <View key={m.id} style={[styles.node, shadow.card, { left: p.x - size / 2, top: p.y - size / 2 }]}>
                <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={m.country} size={size} ring />
                <Text style={[styles.name, { top: size + 3, width: 74, left: size / 2 - 37 }]} numberOfLines={1}>
                  {i === 0 ? 'You' : m.name}
                </Text>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.hairline, marginVertical: space.sm, overflow: 'hidden' },
  node: { position: 'absolute', alignItems: 'center' },
  name: { position: 'absolute', fontSize: 11, fontWeight: '800', color: color.inkSoft, textAlign: 'center' },
});
