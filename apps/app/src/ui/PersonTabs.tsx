import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color } from '../theme/tokens';
import { haptic } from './feedback';

type Tab = 'profile' | 'trust';

/**
 * The one person-page switcher, shared by HostProfile (Profile) and Trust (Trust), so moving
 * between them reads as a tab change on the same page rather than a jump to a different screen.
 * Profile is hidden when the person has nothing to show there (a guest with no listing, read
 * from Requests). Mirrors the desktop PersonView's Profile/Trust tabs.
 */
export function PersonTabs({ active, onProfile, onTrust }: { active: Tab; onProfile?: () => void; onTrust?: () => void }) {
  const tabs: { key: Tab; label: string; go?: () => void }[] = [
    ...(onProfile || active === 'profile' ? [{ key: 'profile' as Tab, label: 'Profile', go: onProfile }] : []),
    { key: 'trust' as Tab, label: 'Trust', go: onTrust },
  ];
  return (
    <View style={styles.bar}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => { if (!on && t.go) { haptic.select(); t.go(); } }}
          >
            <Text style={[styles.label, on && styles.labelOn]}>{t.label}</Text>
            {on ? <View style={styles.indicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', marginTop: 14, borderBottomWidth: 1, borderBottomColor: color.hairline },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 11 },
  label: { fontSize: 14, fontWeight: '600', color: color.inkFaint },
  labelOn: { color: color.ink, fontWeight: '700' },
  indicator: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 2.5, backgroundColor: color.ink, borderRadius: 2 },
});
