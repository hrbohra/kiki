import { useWindowDimensions } from 'react-native';

/**
 * One breakpoint hook. The app is phone-first everywhere; a wide viewport (a desktop browser
 * via react-native-web) opts into the two-column desktop layouts. Same components, different
 * shell — no second codebase.
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  return {
    width,
    isWide: width >= 1080, // two-column desktop
    isMid: width >= 720 && width < 1080,
  };
}
