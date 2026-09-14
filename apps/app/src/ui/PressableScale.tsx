import { forwardRef } from 'react';
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tap } from './feedback';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Haptic on press-in; set null to silence. Default 'light'. */
  haptic?: 'light' | 'medium' | 'heavy' | null;
  /** How far it dips on press. Default 0.96. */
  scaleTo?: number;
};

/** A Pressable that springs down slightly on press and fires a micro-haptic — the iOS-native
 *  "this is tappable and it responded" feel, on every surface (native + web). */
export const PressableScale = forwardRef<any, Props>(function PressableScale(
  { style, haptic = 'light', scaleTo = 0.96, onPressIn, onPressOut, children, ...rest },
  ref,
) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      ref={ref}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 15, stiffness: 420 });
        if (haptic) tap(haptic);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 320 });
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children as any}
    </AnimatedPressable>
  );
});
