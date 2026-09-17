import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Avatar } from './Avatar';
import { color, trustColor } from '../theme/tokens';
import type { Member, RouteView } from '../domain/types';

/**
 * The connection graph, redesigned (17 Sep handoff, graph spec §2.3).
 *
 * Every shortest route is drawn, not one: you on the left, the host on the right, intermediates
 * on dashed rings at one and two steps, ordered by route rank. Each hop carries its measured tie:
 * width = 2 + 1.5·strength, colour = the degree of the far node, dashed when the tie exists but
 * nothing is measured on it. Your other direct people stay faint as context; the host's next ring
 * is a count before it is ever drawn ("14 people know Maia that you don't").
 *
 * Progressive reveal: routes first; tap → your other people; tap → the host's ring. Never all at
 * once. The picture is decorative to assistive tech — the route list beside it is the accessible
 * form and repeats every fact in words.
 */
const VB = { w: 338, h: 250 };
const YOU = { x: 60, y: 125 };
const HOST_X = VB.w - 40;
const RING = (k: number) => 62 + 88 * (k - 1);
const SPREAD_DEG = 38;

interface Props {
  viewer: Member;
  host: Member;
  routes: RouteView[]; // ranked; the first is the strongest
  otherPeople?: string[]; // names of your other direct connections (drawn as stubs, unlabelled)
  nextRingCount: number;
  reachable: boolean;
  direct: boolean;
}

type Pt = { x: number; y: number };
const polar = (c: Pt, r: number, deg: number): Pt => ({ x: c.x + r * Math.cos((deg * Math.PI) / 180), y: c.y + r * Math.sin((deg * Math.PI) / 180) });

export function RouteGraph({ viewer, host, routes, otherPeople = [], nextRingCount, reachable, direct }: Props) {
  const [w, setW] = useState(0);
  // 0 routes · 1 + your people · 2 + host's ring. States switch instantly (nothing to fade under
  // Reduced Motion either), and the SVG re-renders whole — it is a few dozen primitives.
  const [reveal, setReveal] = useState(0);

  const scale = w / VB.w;
  const h = VB.h * scale;
  const px = (p: Pt): Pt => ({ x: p.x * scale, y: p.y * scale });

  // ── layout ────────────────────────────────────────────────────────────────────────────────
  const shown = routes.slice(0, 3);
  const degrees = shown[0] ? shown[0].members.length - 1 : direct ? 1 : 0;
  const hostPt: Pt = { x: HOST_X, y: YOU.y };
  const angleFor = (i: number, n: number) => (n === 1 ? 0 : -SPREAD_DEG + (i * 2 * SPREAD_DEG) / (n - 1));
  // intermediate positions: route i, hop k (1..degrees-1) on ring k
  const nodePos = (i: number, k: number): Pt => polar(YOU, RING(k), angleFor(i, shown.length) * (k === 1 ? 1 : 0.7));
  const nodeSize = shown.length > 2 ? 36 : 42;

  // your other direct people: up to 4 stubs on ring 1, on the side away from the host
  const stubAngles = [150, 180, 210, 120].slice(0, Math.min(4, otherPeople.length));
  // the host's next ring: three faint stubs behind the host
  const hostStubs = [-24, 0, 24];

  const edge = (a: Pt, b: Pt, strength: 1 | 2 | 3, dashed: boolean, far: number, key: string) => (
    <Line
      key={key}
      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
      stroke={trustColor(far)}
      strokeWidth={2 + 1.5 * strength}
      strokeLinecap="round"
      strokeDasharray={dashed ? '1 5' : undefined}
    />
  );

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const cycle = () => setReveal((r) => (r + 1) % 3);

  return (
    <View>
      <Pressable onPress={cycle} accessibilityRole="button" accessibilityLabel={`Connection graph. ${reveal === 0 ? 'Tap to show your other people.' : reveal === 1 ? `Tap to show the ${nextRingCount} people who know ${host.name} that you don't.` : 'Tap to show routes only.'}`}>
        <View style={{ width: '100%', maxWidth: 460, alignSelf: 'center', aspectRatio: VB.w / VB.h }} onLayout={onLayout}>
          {w > 0 ? (
            <>
              <Svg width={w} height={h} viewBox={`0 0 ${VB.w} ${VB.h}`} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {/* rings at one and two steps from you */}
                <Circle cx={YOU.x} cy={YOU.y} r={RING(1)} stroke={color.outerRing} strokeWidth={1} strokeDasharray="3 4" fill="none" />
                <Circle cx={YOU.x} cy={YOU.y} r={RING(2)} stroke={color.outerRing} strokeWidth={1} strokeDasharray="3 4" fill="none" />

                {/* your other direct people, faint (reveal ≥ 1) */}
                {reveal >= 1 ? stubAngles.map((deg, i) => { const p = polar(YOU, RING(1), deg); return (
                  <Line key={`my-${i}`} x1={YOU.x} y1={YOU.y} x2={p.x} y2={p.y} stroke={color.peripheralNode} strokeWidth={1.5} />
                ); }) : null}
                {reveal >= 1 ? stubAngles.map((deg, i) => { const p = polar(YOU, RING(1), deg); return <Circle key={`myd-${i}`} cx={p.x} cy={p.y} r={6} fill={color.peripheralNode} />; }) : null}

                {/* the host's next ring, as stubs + a count (reveal ≥ 2) */}
                {reveal >= 2 && nextRingCount > 0 ? hostStubs.map((deg, i) => { const p = polar(hostPt, 26, deg); return (
                  <Line key={`their-${i}`} x1={hostPt.x} y1={hostPt.y} x2={p.x} y2={p.y} stroke={color.outerRing} strokeWidth={1.5} />
                ); }) : null}
                {reveal >= 2 && nextRingCount > 0 ? hostStubs.map((deg, i) => { const p = polar(hostPt, 26, deg); return <Circle key={`theird-${i}`} cx={p.x} cy={p.y} r={5} fill={color.outerRing} />; }) : null}

                {/* routes: every hop carries its measured tie */}
                {reachable && shown.length === 0 && direct ? edge(YOU, hostPt, 2, false, 1, 'direct') : null}
                {shown.map((r, i) => {
                  const pts: Pt[] = [YOU, ...r.members.slice(1, -1).map((_, k) => nodePos(i, k + 1)), hostPt];
                  return pts.slice(1).map((b, k) => edge(pts[k], b, r.strengths[k] ?? 1, r.dashed[k] ?? false, k + 1, `r${i}-${k}`));
                })}

                {nextRingCount > 0 && reveal >= 2 ? (
                  <SvgText x={VB.w - 12} y={VB.h - 12} fill={color.inkFaint} fontSize={10.5} fontWeight="600" textAnchor="end">
                    {`${nextRingCount} ${nextRingCount === 1 ? 'person knows' : 'people know'} ${host.name.split(' ')[0]} that you don't`}
                  </SvgText>
                ) : null}
              </Svg>

              {/* nodes: intermediates, then the two ends on top */}
              {shown.map((r, i) => r.members.slice(1, -1).map((m, k) => {
                const p = px(nodePos(i, k + 1));
                return (
                  <View key={`${r.members.map((x) => x.id).join('-')}-${m.id}`} style={[styles.node, { left: p.x - nodeSize / 2, top: p.y - nodeSize / 2, width: nodeSize }]} pointerEvents="none">
                    <Avatar id={m.id} name={m.name} tint={m.avatarColor} size={nodeSize} ring />
                    {i < 2 ? <Text style={styles.label} numberOfLines={1}>{m.name.split(' ')[0]}</Text> : null}
                  </View>
                );
              }))}
              <View style={[styles.node, { left: px(YOU).x - 24, top: px(YOU).y - 24, width: 48 }]} pointerEvents="none">
                <Avatar id={viewer.id} name={viewer.name} tint={viewer.avatarColor} size={48} ring />
                <Text style={styles.label}>You</Text>
              </View>
              <View style={[styles.node, { left: px(hostPt).x - 29, top: px(hostPt).y - 29, width: 58 }]} pointerEvents="none">
                <Avatar id={host.id} name={host.name} tint={host.avatarColor} size={58} ring />
                <Text style={styles.label} numberOfLines={1}>{host.name.split(' ')[0]}</Text>
              </View>
            </>
          ) : null}
        </View>
      </Pressable>

      <Text style={styles.hint}>
        {reveal === 0
          ? (routes.length > 3 ? `${routes.length} routes; the strongest three are drawn. Tap for your other people.` : 'Tap to see your other people.')
          : reveal === 1
            ? `Your other direct people, faint. Tap for who knows ${host.name.split(' ')[0]}.`
            : nextRingCount > 0
              ? `${nextRingCount} ${nextRingCount === 1 ? 'person knows' : 'people know'} ${host.name.split(' ')[0]} that you don't. Tap to reset.`
              : `Nobody knows ${host.name.split(' ')[0]} that you don't. Tap to reset.`}
      </Text>
      {degrees >= 3 ? <Text style={styles.hint}>Three steps is the common case in a club this size; two is the gift.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  node: { position: 'absolute', alignItems: 'center' },
  label: { marginTop: 4, fontSize: 11, fontWeight: '700', color: color.inkSoft, textAlign: 'center', width: 72 },
  hint: { marginTop: 10, fontSize: 12, lineHeight: 17, color: color.inkFaint },
});
