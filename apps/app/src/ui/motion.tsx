import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { color } from '../theme/tokens';

/**
 * Two motion primitives from the Sep 2 / Sep 3 handoffs ("The list assembles itself"):
 *
 * - `Reveal`: a card rises into place on a 110ms stagger with an iOS-style spring, so a list reads
 *   as assembling rather than appearing. Index is capped so long lists don't wait forever.
 * - `Halo`: a slow pulse behind an avatar. Used only on a one-step connection — the only animated
 *   thing on a screen is the strongest trust signal, which is the point.
 *
 * Core Animated API, so it behaves the same on native and react-native-web.
 */
export function Reveal({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const delay = Math.min(index, 9) * 110;
    const anim = Animated.spring(t, { toValue: 1, delay, damping: 16, stiffness: 170, mass: 0.9, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [t, index]);
  return (
    <Animated.View style={[style, { opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }, { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export function Halo({ on, size, children }: { on: boolean; size: number; children: ReactNode }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!on) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [on, t]);
  if (!on) return <>{children}</>;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          { width: size, height: size, borderRadius: size / 2 },
          { opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.08] }), transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }] },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute', backgroundColor: color.brand },
});
