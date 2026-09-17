import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../ui/Avatar';
import { haptic } from '../ui/feedback';
import { useReducedMotion } from '../ui/useReducedMotion';
import { useResponsive } from '../ui/useResponsive';
import { COVERS } from '../domain/covers';
import { dateRange, fullDate, money } from '../domain/format';
import { color, shadow } from '../theme/tokens';
import * as world from '../world';
import type { StackProps } from '../navigation';

/**
 * The match moment (17 Sep handoff, 1b): the screen after slide-to-match. Today it was a toast;
 * this is the emotional peak of the product, so it gets a full screen, held until dismissed.
 * No confetti, no "Congratulations": the headline is the fact. The two avatars are joined
 * through the mutual, not directly, because that is literally how the match exists.
 *
 * Motion: avatars settle in with the app's spring, the line draws left → right over 420ms after
 * both land, and the success haptic fires when the line reaches the guest. Reduced Motion: the
 * line appears whole and the haptic fires once.
 */
export function MatchedScreen({ route, navigation }: StackProps<'Matched'>) {
  const { guestId, startInDays, nights } = route.params;
  const { isWide } = useResponsive();
  const reduced = useReducedMotion();
  const guest = world.memberById(guestId);
  const viewer = world.memberById(world.viewerId);
  const story = world.trustStoryFor(guestId);
  const mutual = story.rankedRoutes[0] && story.rankedRoutes[0].members.length > 2 ? story.rankedRoutes[0].members[1] : null;
  const listing = world.listingForHost(world.viewerId);
  const first = guest.name.split(' ')[0];
  const total = (listing?.pricePerNight ?? 0) * nights;

  const land = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const draw = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) { land.setValue(1); draw.setValue(1); haptic.success(); return; }
    Animated.spring(land, { toValue: 1, damping: 14, stiffness: 160, mass: 0.9, useNativeDriver: false }).start();
    // The line starts on a clock, not on the spring's rest callback: a spring can take seconds to
    // report "at rest" on the web, and the line must not wait on that.
    const line = Animated.sequence([
      Animated.delay(520),
      Animated.timing(draw, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]);
    line.start(({ finished }) => { if (finished) haptic.success(); });
    return () => line.stop();
  }, [land, draw, reduced]);

  const done = () => navigation.popToTop();
  const open = (memberId: string) => navigation.navigate('Thread', { memberId });
  const avatarStyle = { opacity: land, transform: [{ scale: land.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]} showsVerticalScrollIndicator={false}>
        <View style={[styles.sheet, isWide && styles.sheetWide]}>
          <View style={styles.top}>
            <View style={{ flex: 1 }} />
            <Pressable onPress={done} hitSlop={12} accessibilityRole="button" accessibilityLabel="Done"><Text style={styles.done}>Done</Text></Pressable>
          </View>

          {/* the two of you, joined through the mutual */}
          <View style={styles.pair} accessible accessibilityLabel={mutual ? `You and ${first}, connected through ${mutual.name.split(' ')[0]}` : `You and ${first}`}>
            <Animated.View style={[styles.end, avatarStyle]}><Avatar id={viewer.id} name={viewer.name} tint={viewer.avatarColor} size={84} ring /></Animated.View>
            <View style={styles.lineWrap}>
              <View style={styles.lineTrack} />
              <Animated.View style={[styles.line, { width: draw.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
              {mutual ? (
                <Animated.View style={[styles.mutual, avatarStyle]}>
                  <Avatar id={mutual.id} name={mutual.name} tint={mutual.avatarColor} size={44} ring />
                  <Text style={styles.mutualLabel}>{mutual.name.split(' ')[0]}</Text>
                </Animated.View>
              ) : null}
            </View>
            <Animated.View style={[styles.end, avatarStyle]}><Avatar id={guest.id} name={guest.name} tint={guest.avatarColor} size={84} ring /></Animated.View>
          </View>

          <Text style={styles.headline} accessibilityRole="header">{first} stays at yours, {dateRange(startInDays, nights, { long: true })}.</Text>
          <Text style={styles.sub}>
            {mutual && story.warm && story.degrees === 2
              ? `${mutual.name.split(' ')[0]}’s name is on this. So is Kiki’s. That’s the match.`
              : mutual
                ? `${story.degrees} steps, through ${mutual.name.split(' ')[0]}. Kiki’s name is on this. That’s the match.`
                : 'Kiki’s name is on this. That’s the match.'}
          </Text>

          <View style={[styles.card, shadow.card]}>
            <Text style={styles.eyebrow}>WHAT HAPPENS NOW</Text>
            {[
              `Kiki confirms ${first}’s ID and payment. ${COVERS.matchLine}`,
              `${money(total)} lands in your account on ${fullDate(startInDays - 7)}, the week before ${first} arrives.`,
              `After ${first} leaves, you write the guest-book entry. It’s how the next host knows ${first}.`,
            ].map((t, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.num}><Text style={styles.numText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]} onPress={() => { haptic.tap(); open(guest.id); }} accessibilityRole="button">
              <Text style={styles.primaryText}>Say hi to {first}</Text>
            </Pressable>
            {mutual ? (
              <Pressable style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.8 }]} onPress={() => { haptic.tap(); open(mutual.id); }} accessibilityRole="button" accessibilityHint="Send a one-line thank-you to the person who connected you">
                <Text style={styles.secondaryText}>Tell {mutual.name.split(' ')[0]}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 28 },
  scrollWide: { justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  sheet: { flex: 1, gap: 18 },
  sheetWide: { flex: 0, width: '100%', maxWidth: 520, backgroundColor: color.surface, borderRadius: 24, padding: 28, ...shadow.card },
  top: { flexDirection: 'row', alignItems: 'center', minHeight: 24 },
  done: { fontSize: 15, fontWeight: '700', color: color.brand },
  pair: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  end: { width: 84, height: 84, borderRadius: 42, ...shadow.card },
  lineWrap: { flex: 1, height: 84, justifyContent: 'center', alignItems: 'center' },
  lineTrack: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2, backgroundColor: color.hairline },
  line: { position: 'absolute', left: 0, height: 3, borderRadius: 2, backgroundColor: color.brand },
  mutual: { alignItems: 'center', gap: 4 },
  mutualLabel: { fontSize: 11, fontWeight: '700', color: color.inkSoft },
  headline: { fontSize: 29, lineHeight: 34, fontWeight: '700', letterSpacing: -0.7, color: color.ink, marginTop: 6 },
  sub: { fontSize: 15, lineHeight: 22, color: color.inkSoft, marginTop: -6 },
  card: { backgroundColor: color.surface, borderRadius: 22, borderWidth: 1, borderColor: color.hairline, padding: 16, gap: 12 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: color.inkFaint },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  num: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.brandTint, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numText: { fontSize: 11, fontWeight: '700', color: color.textOnMint },
  stepText: { flex: 1, fontSize: 14.5, lineHeight: 20, color: color.ink },
  actions: { gap: 10, marginTop: 'auto' },
  primary: { backgroundColor: color.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', ...shadow.brand },
  primaryPressed: { transform: [{ scale: 0.98 }], backgroundColor: color.brandDark },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  secondary: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.hairline, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  secondaryText: { fontSize: 15.5, fontWeight: '700', color: color.textOnMint },
});
