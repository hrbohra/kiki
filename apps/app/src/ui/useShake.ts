import { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { tap } from './feedback';

/** A tasteful micro-shake for "no / invalid" moments (wrong code, rejected action). Pair it with a
 *  haptic. Subtle by design — a flinch, not a wobble. Works on native and web (react-native-web
 *  drives the same Reanimated transform). */
export function useShake() {
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const shake = (withHaptic = true) => {
    if (withHaptic) tap('heavy');
    x.value = withSequence(
      withTiming(-7, { duration: 45 }),
      withTiming(7, { duration: 45 }),
      withTiming(-5, { duration: 45 }),
      withTiming(5, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
  };

  return { style, shake };
}
