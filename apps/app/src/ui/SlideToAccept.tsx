import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Text, View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { color, radius } from '../theme/tokens';
import { haptic } from './feedback';
import { useReducedMotion } from './useReducedMotion';

/**
 * Slide-to-accept — the Requests decision control from the Sep 2 / Sep 3 handoffs ("weight on the
 * yes, nothing on the no"). Accepting someone into your home should take a deliberate gesture, so
 * the knob's travel is eased `max * (raw/max)^1.35`: resistance climbs and the last third takes real
 * effort. Past 86% it commits — the track fills brand, the label becomes "Yes — {name}'s in", a
 * success haptic fires, and `onCommit` runs. Release earlier and it springs home over 380ms.
 * After a commit it holds for 2.4s, then resets (or the parent unmounts it).
 *
 * Native uses PanResponder. The web uses the same pattern as the showcase's hand-written knob:
 * pointerdown on the knob, pointermove / pointerup on the window, and `touch-action: none` so a
 * phone browser never claims the drag as a scroll and cancels it halfway. Both paths feed the same
 * move / release functions, so the easing, the commit point and the haptics are identical.
 */
const KNOB = 48;
const PAD = 4;
const COMMIT_AT = 0.86;
const EASE_POW = 1.35;

export function SlideToAccept({ name, onCommit, label = 'Slide to match' }: { name: string; onCommit: () => void; label?: string }) {
  const [trackW, setTrackW] = useState(0);
  const [committed, setCommitted] = useState(false);
  const x = useRef(new Animated.Value(0)).current;
  const max = Math.max(0, trackW - KNOB - PAD * 2);
  const maxRef = useRef(0);
  maxRef.current = max;
  const crossed = useRef(false);
  const committedRef = useRef(false);
  const reduced = useReducedMotion();
  const reducedRef = useRef(false);
  reducedRef.current = reduced;
  /** The gesture handlers are created once; read the latest onCommit through a ref so a commit
   *  after a re-render never calls a stale callback. */
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const home = () => Animated.timing(x, { toValue: 0, duration: 380, easing: Easing.bezier(0.16, 0.8, 0.24, 1), useNativeDriver: Platform.OS !== 'web' }).start();
  const moveTo = (dx: number) => {
    const m = maxRef.current;
    if (m <= 0) return;
    const raw = Math.min(m, Math.max(0, dx));
    const eased = m * Math.pow(raw / m, EASE_POW);
    x.setValue(eased);
    const p = eased / m;
    if (p >= COMMIT_AT && !crossed.current) { crossed.current = true; haptic.heavy(); }
    if (p < COMMIT_AT && crossed.current) crossed.current = false;
  };
  const releaseAt = (dx: number) => {
    const m = maxRef.current;
    const raw = Math.min(m, Math.max(0, dx));
    const p = m > 0 ? Math.pow(raw / m, EASE_POW) : 0;
    if (p >= COMMIT_AT) {
      committedRef.current = true;
      setCommitted(true);
      Animated.timing(x, { toValue: m, duration: reducedRef.current ? 0 : 160, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }).start();
      haptic.success();
      onCommitRef.current();
    } else {
      home();
    }
  };
  const moveRef = useRef(moveTo);
  moveRef.current = moveTo;
  const releaseRef = useRef(releaseAt);
  releaseRef.current = releaseAt;
  /** VoiceOver double-tap and Reduced Motion both land here: commit without the drag. */
  const commitNow = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    setCommitted(true);
    x.setValue(maxRef.current);
    haptic.success();
    onCommitRef.current();
  };

  useEffect(() => {
    if (!committed) return;
    const t = setTimeout(() => {
      committedRef.current = false;
      crossed.current = false;
      setCommitted(false);
      home();
    }, 2400);
    return () => clearTimeout(t);
  }, [committed, x]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !committedRef.current,
      onMoveShouldSetPanResponder: (_e, g) => !committedRef.current && Math.abs(g.dx) > 2,
      onPanResponderGrant: () => { haptic.select(); },
      onPanResponderMove: (_e, g) => moveRef.current(g.dx),
      onPanResponderRelease: (_e, g) => releaseRef.current(g.dx),
      onPanResponderTerminate: () => releaseRef.current(0),
    }),
  ).current;

  /** Web: the showcase knob's pattern, on the real DOM node. */
  const knobRef = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = knobRef.current as unknown as HTMLElement | null;
    if (!el || typeof el.addEventListener !== 'function') return;
    let startX: number | null = null;
    const move = (e: PointerEvent) => { if (startX !== null) moveRef.current(e.clientX - startX); };
    const up = (e: PointerEvent) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      releaseRef.current(dx);
    };
    const cancel = () => {
      startX = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      releaseRef.current(0);
    };
    const down = (e: PointerEvent) => {
      if (committedRef.current || e.button > 0) return;
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      haptic.select();
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
    };
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';
    el.style.userSelect = 'none';
    el.addEventListener('pointerdown', down);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, []);

  const onLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);
  // The fill trails the knob so the "yes" grows under your thumb.
  const fillW = max > 0 ? Animated.add(x, KNOB + PAD * 2) : new Animated.Value(0);
  const labelOpacity = max > 0 ? x.interpolate({ inputRange: [0, max * 0.5], outputRange: [1, 0], extrapolate: 'clamp' }) : 1;

  return (
    <View
      onLayout={onLayout}
      style={[styles.track, committed && styles.trackCommitted]}
      accessibilityRole="adjustable"
      accessibilityLabel={committed ? `Accepted ${name}` : `${label} ${name}`}
      accessibilityHint="Drag the knob to the right, or double-tap to match"
      accessibilityActions={[{ name: 'activate', label: 'Match' }]}
      onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'activate') commitNow(); }}
    >
      {!committed ? <Animated.View pointerEvents="none" style={[styles.fill, { width: fillW }]} /> : null}
      <Animated.Text style={[styles.label, committed ? styles.labelCommitted : { opacity: labelOpacity }]}>
        {committed ? `Yes — ${name}'s in` : label}
      </Animated.Text>
      <Animated.View ref={knobRef} {...(Platform.OS === 'web' ? {} : pan.panHandlers)} style={[styles.knob, committed && styles.knobCommitted, { transform: [{ translateX: x }] }]}>
        <Text style={[styles.glyph, committed && styles.glyphCommitted]}>{committed ? '✓' : '›'}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: KNOB + PAD * 2, borderRadius: radius.pill, backgroundColor: color.bg, borderWidth: 1, borderColor: color.hairline,
    justifyContent: 'center', overflow: 'hidden', alignSelf: 'stretch',
  },
  trackCommitted: { backgroundColor: color.brand, borderColor: color.brand },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: color.brandTint },
  label: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 15, fontWeight: '700', color: color.inkSoft },
  labelCommitted: { color: '#FFFFFF' },
  knob: {
    position: 'absolute', left: PAD, top: PAD, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: color.brand,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  knobCommitted: { backgroundColor: '#FFFFFF' },
  glyph: { fontSize: 24, lineHeight: 26, fontWeight: '700', color: '#FFFFFF', marginTop: -2 },
  glyphCommitted: { color: color.brand, fontSize: 20 },
});
