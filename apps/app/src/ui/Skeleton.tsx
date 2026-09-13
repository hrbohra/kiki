import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { color } from '../theme/tokens';

/** A gently pulsing placeholder — used instead of spinners while an image decodes or data loads,
 *  so a surface never flashes empty. Cheap, on-brand, and reduces the "is it broken?" beat. */
export function Skeleton({ style }: { style?: any }) {
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.View style={[styles.base, style, { opacity: o }]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: color.hairline, borderRadius: 8 },
});
