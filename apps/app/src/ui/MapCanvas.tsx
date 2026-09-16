import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, Pressable, PanResponder, StyleSheet, LayoutChangeEvent } from 'react-native';
import { mercatorTilePixel } from '../domain/geo';
import { color, radius, shadow } from '../theme/tokens';
import { Loop } from './Loop';
import { Avatar } from './Avatar';
import { Skeleton } from './Skeleton';
import { LivingMap, type LivingLink, type LivingPoint } from './LivingMap';
import { LONDON_MAP, MAP_GRID } from './mapTiles';
import * as world from '../world';
import type { Listing } from '../domain/types';

interface Props {
  listings: Listing[];
  selectedId: string | null;
  degreeForHost: (hostId: string) => number;
  onSelect: (listing: Listing) => void;
}

const GRID = MAP_GRID.cols * MAP_GRID.tileLogical; // 768 logical units
const project = (l: Listing) => mercatorTilePixel(l.lng, l.lat, MAP_GRID.z, MAP_GRID.x0, MAP_GRID.y0);

/**
 * A real map, read the Kiki way: pins are the host's FACE and the ring is how close they are to
 * you — never a price. Fully interactive on web (drag to pan, wheel to zoom about the cursor,
 * +/−/FIT), geographically honest (Web-Mercator over the bundled CARTO tiles), and careful at the
 * edges: a listing off the bundled imagery becomes a boundary chip you tap to fly to, never a
 * face floating on grey. All geometry is derived from the width we render, never an observed one.
 */
export function MapCanvas({ listings, selectedId, degreeForHost, onSelect }: Props) {
  const [mw, setMw] = useState(0);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null); // null = fit-to-bounds
  const [cx, setCx] = useState<number | null>(null);
  const [cy, setCy] = useState<number | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [degFilter, setDegFilter] = useState<1 | 2 | 3 | null>(null);
  const [dragging, setDragging] = useState(false);

  // Bounding box of ALL listings in grid units — frames the map, so filtering pins never reframes.
  const BOUNDS = useMemo(() => {
    const pts = world.allListings().map(project);
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }, []);

  const mh = mapHeight(mw, BOUNDS.h);
  const baseScale = Math.max(mw, mh) / GRID;              // cover: basemap fills the card
  const fitZoom = clamp(Math.min((mw - 96) / (BOUNDS.w * baseScale), (mh - 72) / (BOUNDS.h * baseScale)), 1, 6);
  const zoomVal = clamp(zoom ?? fitZoom, 1, 6);
  const S = baseScale * zoomVal;

  // Clamp the view centre so the imagery always fills the card — collapse an axis to centre once
  // it is fully visible, otherwise keep it inside [half, 768 − half].
  const halfW = mw / 2 / S, halfH = mh / 2 / S;
  const cxEff = 2 * halfW >= GRID ? GRID / 2 : clamp(cx ?? BOUNDS.cx, halfW, GRID - halfW);
  const cyEff = 2 * halfH >= GRID ? GRID / 2 : clamp(cy ?? BOUNDS.cy, halfH, GRID - halfH);
  const ox = mw / 2 - cxEff * S;
  const oy = mh / 2 - cyEff * S;
  const toScreen = (l: Listing) => { const p = project(l); return { x: ox + p.x * S, y: oy + p.y * S }; };

  // Handlers read geometry through a ref so the wheel/pan closures never go stale.
  const geo = useRef({ S, baseScale, zoomVal, cxEff, cyEff, mw, mh });
  geo.current = { S, baseScale, zoomVal, cxEff, cyEff, mw, mh };

  // Split listings into on-view faces and off-view edge markers; a face may only be drawn where
  // its whole box lands on real imagery.
  const faces: { l: Listing; x: number; y: number }[] = [];
  const markers: { l: Listing; dir: 'up' | 'down' | 'left' | 'right'; x: number; y: number }[] = [];
  for (const l of listings) {
    const { x, y } = toScreen(l);
    if (y >= 35 && y <= mh - 35 && x >= 47 && x <= mw - 47) {
      faces.push({ l, x, y });
    } else {
      const dir = y < 35 ? 'up' : y > mh - 35 ? 'down' : x < 47 ? 'left' : 'right';
      const ex = dir === 'up' || dir === 'down' ? clamp(x, 76, mw - 76) : dir === 'left' ? 12 : mw - 12;
      const ey = dir === 'left' || dir === 'right' ? clamp(y, 40, mh - 40) : dir === 'up' ? 10 : mh - 34;
      markers.push({ l, dir, x: ex, y: ey });
    }
  }
  relax(faces, mw, mh); // de-cluster only the in-view faces

  // ── Living-map overlay data, screen space. Honesty rule: derived only from real listing
  // coordinates and real degrees — never a constant, never a line between two people. ──
  const livePoints: LivingPoint[] = faces.map(({ l, x, y }) => ({ id: l.id, x, y, deg: degreeForHost(l.hostId) }));
  const reachPts = livePoints.filter((p) => Number.isFinite(p.deg) && p.deg <= 2);
  const reach = reachPts.length
    ? (() => {
        const rcx = reachPts.reduce((s, p) => s + p.x, 0) / reachPts.length;
        const rcy = reachPts.reduce((s, p) => s + p.y, 0) / reachPts.length;
        const r = Math.max(80, ...reachPts.map((p) => Math.hypot(p.x - rcx, p.y - rcy))) + 46;
        return { cx: rcx, cy: rcy, r };
      })()
    : null;
  const links: LivingLink[] = [];
  const seenLink = new Set<string>();
  for (const a of reachPts) {
    let best: LivingPoint | null = null, bd = Infinity;
    for (const b of reachPts) {
      if (a.id === b.id) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < bd) { bd = d; best = b; }
    }
    if (best) {
      const key = [a.id, best.id].sort().join('|');
      if (!seenLink.has(key)) { seenLink.add(key); links.push({ x1: a.x, y1: a.y, x2: best.x, y2: best.y }); }
    }
  }

  const outside = markers.length;
  const nearYou = listings.filter((l) => { const d = degreeForHost(l.hostId); return Number.isFinite(d) && d <= 2; }).length;

  // Pan with the mouse; a real drag (>3px) suppresses the pin tap underneath it. The grant seeds
  // the start centre so cumulative deltas apply against where the drag began, not each frame's centre.
  const dragStart = useRef({ cx: 0, cy: 0 });
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => Math.hypot(g.dx, g.dy) > 3,
      onPanResponderGrant: () => { dragStart.current = { cx: geo.current.cxEff, cy: geo.current.cyEff }; setDragging(true); },
      onPanResponderMove: (_e, g) => {
        const { S: s } = geo.current;
        setCx(dragStart.current.cx - g.dx / s); setCy(dragStart.current.cy - g.dy / s);
      },
      onPanResponderRelease: () => setDragging(false),
      onPanResponderTerminate: () => setDragging(false),
    }),
  ).current;

  // Wheel zoom, anchored on the cursor. RN-web forwards the View ref to the host node, so we
  // attach a non-passive wheel listener directly and drive state from the geometry ref.
  const nodeRef = useRef<any>(null);
  useEffect(() => {
    const n = nodeRef.current;
    if (!n || !n.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { S: s, baseScale: bs, zoomVal: z, cxEff: bx, cyEff: by, mw: w, mh: h } = geo.current;
      const px = e.offsetX, py = e.offsetY;
      const gx = bx + (px - w / 2) / s, gy = by + (py - h / 2) / s; // grid point under the cursor
      const z2 = clamp(z * (e.deltaY < 0 ? 1.16 : 1 / 1.16), 1, 6);
      const s2 = bs * z2;
      setZoom(z2);
      setCx(gx - (px - w / 2) / s2); // keep that grid point under the cursor
      setCy(gy - (py - h / 2) / s2);
    };
    n.addEventListener('wheel', onWheel, { passive: false });
    return () => n.removeEventListener('wheel', onWheel);
  }, []);

  const compact = mw > 0 && mw < 560; // phone: collapse the HUD so it doesn't crowd the map
  const zoomBy = (f: number) => setZoom(clamp(zoomVal * f, 1, 6));
  const fit = () => { setZoom(null); setCx(null); setCy(null); };
  const flyTo = (l: Listing) => {
    const p = project(l);
    setZoom(Math.max(zoomVal, 1.6)); setCx(p.x); setCy(p.y); onSelect(l);
  };

  return (
    <View
      ref={nodeRef}
      style={[styles.map, { height: mh }]}
      onLayout={(e: LayoutChangeEvent) => setMw(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      {mw > 0 ? (
        <>
          <Image
            source={LONDON_MAP}
            style={{ position: 'absolute', left: 0, top: 0, width: GRID, height: GRID, transform: [{ translateX: ox }, { translateY: oy }, { scale: S }] as any, transformOrigin: '0 0' } as any}
            resizeMode="cover"
            onLoad={() => setTilesLoaded(true)}
          />
          {!tilesLoaded ? <Skeleton style={{ ...StyleSheet.absoluteFillObject, borderRadius: 0 }} /> : null}
          <View style={[styles.scrim, { cursor: dragging ? 'grabbing' : 'grab' } as any]} pointerEvents="none" />
          <View style={styles.watermark} pointerEvents="none"><Loop size={150} color={color.brand} opacity={0.12} strokeWidth={5} /></View>

          <LivingMap width={mw} height={mh} points={livePoints} reach={reach} links={links} />

          {/* edge markers for listings off the bundled imagery */}
          {markers.map(({ l, dir, x, y }) => {
            const host = world.memberById(l.hostId);
            return (
              <Pressable key={`m-${l.id}`} onPress={() => flyTo(l)} style={[styles.marker, { left: clamp(x, 8, mw - 8), top: y }]}>
                <Text style={styles.markerText}>{CHEVRON[dir]} {host.name} · {l.area.split(',')[0]}</Text>
              </Pressable>
            );
          })}

          {/* in-view face pins */}
          {faces.map(({ l, x, y }) => {
            const host = world.memberById(l.hostId);
            const deg = degreeForHost(l.hostId);
            const selected = l.id === selectedId;
            const isHover = l.id === hover;
            const av = selected ? 50 : 40;
            const r = ringOf(deg);
            const faded = degFilter != null && bucket(deg) !== degFilter;
            return (
              <Pressable
                key={l.id}
                onPress={() => onSelect(l)}
                onHoverIn={() => setHover(l.id)}
                onHoverOut={() => setHover((h) => (h === l.id ? null : h))}
                style={[styles.pin, { left: x, top: y, opacity: faded ? 0.22 : 1, zIndex: selected ? 6 : isHover ? 5 : 2 } as any]}
                accessibilityRole="button"
                accessibilityLabel={`${host.name}, ${connLabel(l.hostId)}`}
              >
                <View style={[styles.ring, shadow.card, { width: av + r.w * 2, height: av + r.w * 2, borderRadius: (av + r.w * 2) / 2, borderWidth: r.w, borderColor: selected ? color.brand : r.c, borderStyle: r.dashed ? 'dashed' : 'solid' }]}>
                  <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={av} />
                </View>
                <View style={[styles.label, selected && styles.labelSelected]}>
                  <Text style={[styles.labelText, selected && styles.labelTextSelected]} numberOfLines={1}>
                    {isHover ? host.name.split(' ')[0] : connLabel(l.hostId)}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {/* count HUD (top-left) — title only on a phone */}
          <View style={styles.hud} pointerEvents="none">
            <Text style={styles.hudTitle}>{listings.length} {listings.length === 1 ? 'home' : 'homes'} on the map</Text>
            {compact ? null : <Text style={styles.hudSub}>{outside > 0 ? `${outside} sit outside this view — tap the marker to go there` : `${nearYou} are within two steps of you`}</Text>}
          </View>

          {/* legend (top-right) — click a ring to filter by degree; rings-only on a phone */}
          <View style={[styles.legend, compact && styles.legendCompact]}>
            <LegendRow w={3} c={color.trust1} label="One step from you" active={degFilter === 1} compact={compact} onPress={() => setDegFilter((d) => (d === 1 ? null : 1))} />
            <LegendRow w={2} c={color.trust2} label="Two steps" active={degFilter === 2} compact={compact} onPress={() => setDegFilter((d) => (d === 2 ? null : 2))} />
            <LegendRow w={1.5} c={color.trust3} dashed label="Three or more" active={degFilter === 3} compact={compact} onPress={() => setDegFilter((d) => (d === 3 ? null : 3))} />
            {compact ? null : <Text style={styles.legendHint}>{degFilter ? 'Filtered — click again to clear' : 'Click a ring to filter'}</Text>}
          </View>

          {/* zoom controls (bottom-right) */}
          <View style={styles.zoomBox}>
          </View>

          <Text style={styles.attribution}>© OpenStreetMap · CARTO</Text>
        </>
      ) : null}
    </View>
  );
}

const CHEVRON = { up: '↑', down: '↓', left: '←', right: '→' } as const;

/** Card height is derived from the projected bounding box, never a fixed pixel value — a fixed
 *  height forces the extreme listings off-screen. Capped at the width so the cover basemap stays
 *  taller than the card. */
function mapHeight(mw: number, boundsH: number): number {
  if (mw <= 0) return 600;
  return clamp(Math.round(boundsH * (mw / GRID) + 96), 520, Math.max(mw, 520));
}

/** Ring weight + colour by social distance. */
function ringOf(deg: number): { w: number; c: string; dashed: boolean } {
  if (!Number.isFinite(deg)) return { w: 1.5, c: color.trust3, dashed: true };
  if (deg <= 1) return { w: 3, c: color.trust1, dashed: false };
  if (deg === 2) return { w: 2, c: color.trust2, dashed: false };
  return { w: 1.5, c: color.trust3, dashed: true };
}

function bucket(deg: number): 1 | 2 | 3 {
  if (!Number.isFinite(deg) || deg >= 3) return 3;
  return deg <= 1 ? 1 : 2;
}

/** A person-shaped label, never a price. */
function connLabel(hostId: string): string {
  const s = world.storyFor(hostId);
  if (!s.reachable) return 'New here';
  if (s.degrees === 1) return 'You know them';
  if (s.degrees === 2 && s.path[1]) return `Friend of ${s.path[1].name}`;
  return `${s.degrees} steps away`;
}

/** Relaxation de-cluster over in-view faces only: push any pair closer than 58px apart, then
 *  clamp back inside the drawable box. Deterministic (golden-angle fan for coincident points). */
function relax(faces: { l: Listing; x: number; y: number }[], mw: number, mh: number): void {
  const MIN = 58;
  for (let iter = 0; iter < 90; iter++) {
    let moved = false;
    for (let a = 0; a < faces.length; a++) {
      for (let b = a + 1; b < faces.length; b++) {
        const pa = faces[a], pb = faces[b];
        let dx = pb.x - pa.x, dy = pb.y - pa.y, d = Math.hypot(dx, dy);
        if (d >= MIN) continue;
        if (d < 0.01) { const ang = a * 2.399963; dx = Math.cos(ang); dy = Math.sin(ang); d = 1; }
        const push = (MIN - d) / 2, ux = dx / d, uy = dy / d;
        pa.x -= ux * push; pa.y -= uy * push; pb.x += ux * push; pb.y += uy * push;
        moved = true;
      }
    }
    for (const p of faces) { p.x = clamp(p.x, 47, mw - 47); p.y = clamp(p.y, 35, mh - 35); }
    if (!moved) break;
  }
}

function LegendRow({ w, c, dashed, label, active, compact, onPress }: { w: number; c: string; dashed?: boolean; label: string; active: boolean; compact?: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.legendRow, active && styles.legendRowActive]} onPress={onPress} accessibilityLabel={label}>
      <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: w, borderColor: c, borderStyle: dashed ? 'dashed' : 'solid' }} />
      {compact ? null : <Text style={[styles.legendLabel, active && styles.legendLabelActive]}>{label}</Text>}
    </Pressable>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  if (hi < lo) return lo;
  return n < lo ? lo : n > hi ? hi : n;
}

const HUD_CARD = { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: radius.md } as const;

const styles = StyleSheet.create({
  map: { width: '100%', minHeight: 520, backgroundColor: color.mapLand, borderRadius: 20, overflow: 'hidden' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(231,244,240,0.10)' },
  watermark: { position: 'absolute', left: 16, bottom: 22 },
  pin: { position: 'absolute', alignItems: 'center', transform: [{ translateX: '-50%' }, { translateY: '-50%' }] as any },
  ring: { backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 4, backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, ...shadow.card, maxWidth: 150 },
  labelSelected: { backgroundColor: color.brand },
  labelText: { fontSize: 11, fontWeight: '700', color: color.textOnMint },
  labelTextSelected: { color: '#FFFFFF' },
  marker: { position: 'absolute', transform: [{ translateX: '-50%' }] as any, backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: color.hairlineTint, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, zIndex: 7 },
  markerText: { fontSize: 11, fontWeight: '700', color: color.textOnMint },
  hud: { position: 'absolute', left: 12, top: 12, ...HUD_CARD, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 240 },
  hudTitle: { fontSize: 13, fontWeight: '700', color: color.ink },
  hudSub: { fontSize: 11.5, color: color.inkFaint, marginTop: 2 },
  legend: { position: 'absolute', right: 12, top: 12, ...HUD_CARD, padding: 10, gap: 4 },
  legendCompact: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 },
  legendRowActive: { backgroundColor: color.brandTint },
  legendLabel: { fontSize: 11.5, fontWeight: '600', color: color.inkSoft },
  legendLabelActive: { color: color.textOnMint, fontWeight: '700' },
  legendHint: { fontSize: 10.5, fontWeight: '600', color: color.inkFaint, marginTop: 2, paddingHorizontal: 4 },
  zoomBox: { position: 'absolute', right: 12, bottom: 26, gap: 6 },
  zoomBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', ...shadow.card },
  zoomGlyph: { fontSize: 19, fontWeight: '700', color: color.ink, lineHeight: 22 },
  zoomFit: { fontSize: 10, fontWeight: '700', color: color.inkSoft },
  attribution: { position: 'absolute', right: 6, bottom: 4, fontSize: 9, fontWeight: '600', color: color.inkFaint, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden' },
});
