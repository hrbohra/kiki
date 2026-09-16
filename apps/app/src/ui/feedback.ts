import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Semantic, restrained haptics — NOT a buzz on every tap. Only the moments that carry meaning on a
 * trust network: a selection changes, the mutual-friend intro lands, an offer is accepted.
 *
 * Native (iOS/Android) goes through expo-haptics so each tier hits the right Taptic pattern
 * (impact / selection / notification). The web gets the Vibration API where a browser supports it
 * (a silent no-op on iOS Safari). Every call is wrapped so it can never throw into a render path.
 *
 * This restores the four tiers the original kiki-ios build had; the migration had flattened them to
 * a single raw `Vibration.vibrate`, which on iOS is a coarse buzz rather than a Taptic tick.
 */
const native = Platform.OS === 'ios' || Platform.OS === 'android';
const swallow = () => {};

function vibrateWeb(ms: number) {
  try {
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { vibrate?: (n: number) => boolean }) : undefined;
    nav?.vibrate?.(ms);
  } catch {
    /* unavailable */
  }
}

export const haptic = {
  /** A light tick — a message sent, a pin tapped, a CTA pressed. */
  tap: () => {
    if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(swallow);
    else vibrateWeb(8);
  },
  /** A crisp selection change — a segmented toggle, a filter, a fact switch, a tab. */
  select: () => {
    if (native) Haptics.selectionAsync().catch(swallow);
    else vibrateWeb(6);
  },
  /** A medium thud — something meaningful landed (the trust intro finished writing). */
  land: () => {
    if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(swallow);
    else vibrateWeb(14);
  },
  /** Success notification — an offer accepted, a request accepted, onboarding finished. */
  success: () => {
    if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(swallow);
    else vibrateWeb(22);
  },
  /** A heavier impact — the slide-to-accept knob crossing the commit line. */
  heavy: () => {
    if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(swallow);
    else vibrateWeb(22);
  },
};

/** Back-compat for the press-scale primitive: a plain impact at the requested weight. */
export function tap(kind: 'light' | 'medium' | 'heavy' = 'light'): void {
  try {
    if (native) {
      const style = kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(style).catch(swallow);
    } else if (Platform.OS === 'web') {
      vibrateWeb(kind === 'heavy' ? 22 : kind === 'medium' ? 14 : 8);
    } else {
      Vibration.vibrate(8);
    }
  } catch {
    /* haptics unavailable — ignore */
  }
}
