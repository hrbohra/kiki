import { useEffect } from 'react';
import { StyleSheet, View, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue, useFrameCallback, useAnimatedProps, useAnimatedStyle,
  useReducedMotion, interpolate, type SharedValue,
} from 'react-native-reanimated';
import { color } from '../theme/tokens';

/**
 * The living map — four ambient layers over the bespoke MapCanvas. Additive only.
 *
 * Honesty rule: motion may respond to real coordinates and real degrees, and nothing else.
 * Layer 03's radius is the bounding circle of everything within two steps of you (graph-tied,
 * grows as your network grows). Links are only ever drawn between two listings, both real
 * coordinates. No Skia — one implementation (react-native-svg + expo-linear-gradient +
 * Reanimated) that runs in Expo Go and on react-native-web. See kiki-map-no-skia decision.
 */

const ACircle = Animated.createAnimatedComponent(Circle);
const ALine = Animated.createAnimatedComponent(Line);

export interface LivingPoint { id: string; x: number; y: number; deg: number }
export interface ReachWashData { cx: number; cy: number; r: number }
export interface LivingLink { x1: number; y1: number; x2: number; y2: number }

interface Props {
  width: number;
  height: number;
  points: LivingPoint[];
  reach: ReachWashData | null;
  links: LivingLink[];
  /** Whether the map is on-screen. Pass the tab's focus state; loops pause when false.
   *  Kept a prop (not an internal useIsFocused) so this file is portable to the web build,
   *  which has no react-navigation context. */
  active?: boolean;
}

export function LivingMap({ width, height, points, reach, links, active = true }: Props) {
  const reduce = useReducedMotion();

  // ── One shared clock for every ambient layer (ms). Paused off-focus and in background. ──
  const clock = useSharedValue(0);
  const frame = useFrameCallback((info) => {
    'worklet';
    clock.value = info.timeSinceFirstFrame ?? 0;
  }, false);

  useEffect(() => {
    const sync = () => frame.setActive(active && AppState.currentState === 'active');
    sync();
    const sub = AppState.addEventListener('change', sync);
    return () => { sub.remove(); frame.setActive(false); };
  }, [active, frame]);

  if (width <= 0 || height <= 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {!reduce ? <LightSweep clock={clock} width={width} height={height} /> : null}

      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="wash" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color.brand} stopOpacity={0.22} />
            <Stop offset="70%" stopColor={color.brand} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={color.brand} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="cloud" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#0F1B17" stopOpacity={0.16} />
            <Stop offset="100%" stopColor="#0F1B17" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {!reduce ? <CloudDrift clock={clock} width={width} height={height} /> : null}
        {reach ? <ReachWash clock={clock} reach={reach} reduce={reduce} /> : null}
        {!reduce ? links.map((l, i) => <MarchingLink key={i} clock={clock} link={l} />) : null}
        {!reduce ? points.map((p, i) => <BreathingHalo key={p.id} clock={clock} point={p} index={i} />) : null}
      </Svg>
    </View>
  );
}

/** Layer 01 — a soft white band travelling across the basemap. Reads as weather; carries no
 *  meaning, which is why it may loop forever. (Low-opacity white in place of Skia soft-light.) */
function LightSweep({ clock, width, height }: { clock: SharedValue<number>; width: number; height: number }) {
  const bandW = width * 0.55;
  const style = useAnimatedStyle(() => {
    const t = (clock.value % 11000) / 11000; // 11s
    return { transform: [{ translateX: interpolate(t, [0, 1], [-bandW, width]) }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: bandW }, style]} pointerEvents="none">
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ width: bandW, height }}
      />
    </Animated.View>
  );
}

/** Layer 02 — one large radial darkening on a slow drift. Depth without parallax. */
function CloudDrift({ clock, width, height }: { clock: SharedValue<number>; width: number; height: number }) {
  const R = Math.max(width, height) * 0.7;
  const props = useAnimatedProps(() => {
    const t = (clock.value % 34000) / 34000; // 34s
    const a = t * Math.PI * 2;
    return {
      cx: width * 0.5 + Math.cos(a) * width * 0.22,
      cy: height * 0.5 + Math.sin(a) * height * 0.16,
    };
  });
  return <ACircle animatedProps={props} r={R} fill="url(#cloud)" />;
}

/** Layer 03 — the reach wash. Data: radius is the bounding circle of everything within two steps
 *  of you, so it grows as your network does. The only layer tied to the graph. */
function ReachWash({ clock, reach, reduce }: { clock: SharedValue<number>; reach: ReachWashData; reduce: boolean }) {
  const props = useAnimatedProps(() => {
    if (reduce) return { r: reach.r * 0.85, opacity: 0.5 };
    const t = (clock.value % 7500) / 7500; // 7.5s
    return { r: interpolate(t, [0, 1], [reach.r * 0.35, reach.r]), opacity: interpolate(t, [0, 0.15, 1], [0, 0.9, 0]) };
  });
  return <ACircle animatedProps={props} cx={reach.cx} cy={reach.cy} fill="url(#wash)" />;
}

/** Layer 04a — pins breathe on a 5.6s cycle, staggered so the map never pulses in unison. */
function BreathingHalo({ clock, point, index }: { clock: SharedValue<number>; point: LivingPoint; index: number }) {
  const stagger = (index % 3) * 1400; // 0 / 1.4 / 2.8s
  const props = useAnimatedProps(() => {
    const t = (((clock.value + stagger) % 5600) / 5600) * Math.PI * 2; // 5.6s
    const pulse = (Math.sin(t) + 1) / 2; // 0..1
    return { r: 22 + pulse * 7, opacity: 0.05 + pulse * 0.10 };
  });
  const tint = point.deg <= 1 ? color.trust1 : point.deg === 2 ? color.trust2 : color.trust3;
  return <ACircle animatedProps={props} cx={point.x} cy={point.y} fill={tint} />;
}

/** Layer 04b — dashed links march slowly, and only ever between two listings (real coordinates). */
function MarchingLink({ clock, link }: { clock: SharedValue<number>; link: LivingLink }) {
  const props = useAnimatedProps(() => {
    const t = (clock.value % 2600) / 2600;
    return { strokeDashoffset: interpolate(t, [0, 1], [0, -14]) };
  });
  return (
    <ALine
      animatedProps={props}
      x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2}
      stroke={color.trust2} strokeWidth={1.4} strokeOpacity={0.35}
      strokeDasharray="5 9" strokeLinecap="round"
    />
  );
}
