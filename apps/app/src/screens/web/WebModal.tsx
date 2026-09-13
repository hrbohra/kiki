import { useEffect, useRef } from 'react';
import { Animated, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { color } from '../../theme/tokens';

/** The one modal shell: a dark scrim with a centred, scrollable card that springs gently up on
 *  open. Click the scrim or the × to dismiss. Web-only (position: fixed) — the desktop surface is
 *  the only place modals open. */
export function WebModal({ width = 560, onClose, children }: { width?: number; onClose: () => void; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 9, tension: 90 }).start();
  }, [anim]);
  const cardStyle = {
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  };
  return (
    <View style={SCRIM}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <Animated.View style={[styles.card, { maxWidth: width }, cardStyle]}>
        <Pressable style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close"><Text style={styles.closeGlyph}>×</Text></Pressable>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </Animated.View>
    </View>
  );
}

// position:'fixed' is web-only and outside RN's ViewStyle union, so this lives as a cast object.
const SCRIM = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.overlayDark, padding: 40, alignItems: 'center', justifyContent: 'center', zIndex: 60 } as any;

const styles = StyleSheet.create({
  card: { width: '100%', maxHeight: '100%', backgroundColor: color.surface, borderRadius: 20, shadowColor: '#1A1A1A', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  close: { position: 'absolute', top: 12, right: 14, zIndex: 2, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeGlyph: { fontSize: 26, fontWeight: '400', color: color.inkFaint, lineHeight: 28 },
  body: { padding: 28 },
});
