import { Platform, Vibration } from 'react-native';

/** Micro-haptics that work everywhere they can: the Web Vibration API in mobile browsers (a no-op
 *  on iOS Safari, which is fine), and native Vibration on device. Kept subtle — a whisper, not a buzz.
 *  This is the web-haptics seam; native can later upgrade to expo-haptics for richer feedback. */
const DURATION: Record<'light' | 'medium' | 'heavy', number> = { light: 8, medium: 14, heavy: 22 };

export function tap(kind: 'light' | 'medium' | 'heavy' = 'light'): void {
  try {
    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { vibrate?: (n: number) => boolean }) : undefined;
      nav?.vibrate?.(DURATION[kind]);
    } else {
      Vibration.vibrate(DURATION[kind]);
    }
  } catch {
    /* haptics unavailable — ignore */
  }
}
