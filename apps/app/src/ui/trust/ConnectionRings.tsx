import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import { Avatar } from '../Avatar';
import { color } from '../../theme/tokens';
import type { Member, VouchChannel } from '../../domain/types';

interface Props {
  viewer: Member;
  host: Member;
  channels: VouchChannel[]; // up to two shown, left then right
  peripheral?: string[]; // names for the two ring-1 dots (optional, no labels drawn)
  highlight?: number | null; // desktop cross-highlight: emphasise channel i, dim the other
  onHover?: (i: number | null) => void; // report node hover back to the page
}

const VB = { w: 340, h: 312 };
// Anchor points as fractions of the viewBox (so nodes track the SVG when it scales).
const F = {
  you: [0.5, 0.497],
  host: [0.5, 0.176],
  left: [0.368, 0.413],
  right: [0.632, 0.413],
  dotL: [0.429, 0.644],
  dotR: [0.571, 0.644],
} as const;

/**
 * The ring diagram. Two independent visual channels that are free to disagree: line WEIGHT
 * encodes tie strength; SOLID vs DASHED encodes whether a note exists. A close friend who
 * wrote nothing draws thick and dashed. The SVG is hidden from assistive tech; a text twin
 * below carries the same four facts.
 */
export function ConnectionRings({ viewer, host, channels, peripheral = [], highlight = null, onHover }: Props) {
  const [w, setW] = useState(0);
  const h = (w * VB.h) / VB.w;
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const left = channels[0];
  const right = channels[1];
  const weight = (s: 1 | 2 | 3) => (s >= 3 ? 3.8 : s === 2 ? 2.7 : 1.7);
  const dim = (i: number) => (highlight == null || highlight === i ? 1 : 0.22);

  // px position of a fraction anchor
  const px = (f: readonly [number, number]) => ({ x: f[0] * w, y: f[1] * h });

  const node = (m: Member, f: readonly [number, number], size: number, ring: boolean) => {
    const p = px(f);
    return (
      <View key={m.id} style={[styles.node, { left: p.x - size / 2, top: p.y - size / 2 }]}>
        <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={undefined} size={size} ring={ring} />
      </View>
    );
  };

  /** A voucher node that reports hover and dims when the other channel is highlighted. */
  const voucherNode = (m: Member, f: readonly [number, number], i: number) => {
    const size = 44;
    const p = px(f);
    return (
      <Pressable
        key={m.id}
        onHoverIn={() => onHover?.(i)}
        onHoverOut={() => onHover?.(null)}
        onPress={() => onHover?.(highlight === i ? null : i)}
        style={[styles.node, { left: p.x - size / 2, top: p.y - size / 2, opacity: dim(i) }]}
        accessibilityRole="button"
        accessibilityLabel={m.name}
      >
        <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={undefined} size={size} ring />
      </Pressable>
    );
  };

  return (
    <View>
      <View style={{ width: '100%', aspectRatio: VB.w / VB.h }} onLayout={onLayout}>
        {w > 0 ? (
          <>
            <Svg
              width={w}
              height={h}
              viewBox={`0 0 ${VB.w} ${VB.h}`}
              style={StyleSheet.absoluteFill}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Circle cx={170} cy={155} r={52} stroke={color.hairline} strokeWidth={1} fill="none" />
              <Circle cx={170} cy={155} r={100} stroke={color.hairline} strokeWidth={1} fill="none" />
              <Circle cx={170} cy={155} r={148} stroke={color.outerRing} strokeWidth={1} strokeDasharray="3 5" fill="none" />

              {/* peripheral ring-1 neighbours */}
              <Line x1={170} y1={155} x2={146} y2={201} stroke={color.peripheralNode} strokeWidth={1.6} />
              <Line x1={170} y1={155} x2={194} y2={201} stroke={color.peripheralNode} strokeWidth={1.6} />
              <Circle cx={146} cy={201} r={9} fill={color.peripheralNode} />
              <Circle cx={194} cy={201} r={9} fill={color.peripheralNode} />

              {/* channel routes: left then right */}
              {left ? (
                <Path
                  d="M170 155 L125 129 L170 55"
                  stroke={color.trust1}
                  strokeWidth={weight(left.tie.strength)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray={left.note ? undefined : '5 4'}
                  opacity={dim(0)}
                />
              ) : null}
              {right ? (
                <Path
                  d="M170 155 L215 129 L170 55"
                  stroke={color.trust1}
                  strokeWidth={weight(right.tie.strength)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray={right.note ? undefined : '5 4'}
                  opacity={dim(1)}
                />
              ) : null}

              <SvgText x={170} y={300} fill={color.inkFaint} fontSize={10.5} fontWeight="600" textAnchor="middle">
                Past this ring, we stop counting connections
              </SvgText>
            </Svg>

            {node(host, F.host, 48, true)}
            {left ? voucherNode(left.voucher, F.left, 0) : null}
            {right ? voucherNode(right.voucher, F.right, 1) : null}
            {node(viewer, F.you, 44, true)}
          </>
        ) : null}
      </View>

      {/* Legend — two independent channels, spelled out */}
      <View style={styles.legend}>
        <LegendRow swatch={<View style={[styles.line, { backgroundColor: color.trust1, height: 3 }]} />} label="Left a note" />
        <LegendRow swatch={<View style={[styles.line, styles.dashed]} />} label="No note" />
        <LegendRow
          swatch={<View style={styles.bars}><View style={[styles.tbar, { height: 5 }]} /><View style={[styles.tbar, { height: 2 }]} /></View>}
          label="Thicker means you know them better"
        />
      </View>

      {/* Screen-reader twin: same four facts, no picture */}
      <View accessible accessibilityRole="summary" style={styles.srOnly}>
        {channels.map((c) => (
          <Text key={c.voucher.id}>
            {c.voucher.name} is one step from you. {c.tie.reason} {c.note ? `They left a note about ${host.name}.` : 'They left no note.'}
          </Text>
        ))}
        <Text>{host.name} is two steps from you, reached through {channels.map((c) => c.voucher.name).join(' and ')}.</Text>
        <Text>Anyone more than three steps away is not shown, because that distance carries no useful signal.</Text>
      </View>
    </View>
  );
}

function LegendRow({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={styles.swatch}>{swatch}</View>
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  node: { position: 'absolute' },
  legend: { gap: 6, marginTop: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 16, alignItems: 'center', justifyContent: 'center' },
  line: { width: 16, borderRadius: 2 },
  dashed: { width: 16, height: 0, borderTopWidth: 3, borderTopColor: color.trust1, borderStyle: 'dashed' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  tbar: { width: 3, backgroundColor: color.trust1, borderRadius: 1 },
  legendLabel: { fontSize: 11.5, fontWeight: '600', color: color.inkFaint },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
});
