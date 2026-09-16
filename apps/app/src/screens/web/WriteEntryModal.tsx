import { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { WebModal } from './WebModal';
import { color, radius } from '../../theme/tokens';

const SIGNALS = ['felt safe', 'like a friend', 'looked after me', 'would host again'];

/** Write a guest-book entry — the reciprocity loop made concrete. Free text plus the same trust
 *  signals the guest book counts, then a disclosure about who sees it. Posting closes the loop. */
export function WriteEntryModal({ guestName, place, onPost, onClose }: { guestName: string; place: string; onPost: () => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (s: string) => setPicked((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });

  return (
    <WebModal width={560} onClose={onClose}>
      <Text style={styles.title}>Write {guestName}'s guest-book entry</Text>
      <Text style={styles.sub}>{place}</Text>

      <TextInput
        style={styles.textarea as any}
        multiline
        placeholder="What was it actually like staying there?"
        placeholderTextColor={color.inkFaint}
        value={text}
        onChangeText={setText}
      />

      <Text style={styles.eyebrow}>TRUST SIGNALS</Text>
      <View style={styles.chips}>
        {SIGNALS.map((s) => {
          const on = picked.has(s);
          return (
            <Pressable key={s} onPress={() => toggle(s)} style={[styles.chip, on ? styles.chipOn : styles.chipOff]}>
              <Text style={[styles.chipText, on ? styles.chipTextOn : styles.chipTextOff]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.disclosure}>{guestName} will see your name on this. Entries stay editable for 48 hours, then they're hers.</Text>

      <View style={styles.actions}>
        <Pressable style={styles.secondary} onPress={onClose}><Text style={styles.secondaryText}>Not now</Text></Pressable>
        <Pressable style={styles.primary} onPress={onPost}><Text style={styles.primaryText}>Post entry</Text></Pressable>
      </View>
    </WebModal>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 19, lineHeight: 26, fontWeight: '700', color: color.ink, paddingRight: 32 },
  sub: { fontSize: 14, color: color.inkFaint, marginTop: 4 },
  textarea: { marginTop: 16, minHeight: 120, backgroundColor: color.screen, borderWidth: 1, borderColor: color.hairline, borderRadius: 12, padding: 14, fontSize: 15, lineHeight: 22, color: color.ink, textAlignVertical: 'top' },
  eyebrow: { fontSize: 11.5, fontWeight: '700', color: color.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  chipOn: { backgroundColor: color.brandTint, borderColor: color.brand },
  chipOff: { backgroundColor: color.surface, borderColor: color.hairline },
  chipText: { fontSize: 13, fontWeight: '700' },
  chipTextOn: { color: color.textOnMint },
  chipTextOff: { color: color.inkSoft },
  disclosure: { fontSize: 13, lineHeight: 19, color: color.inkFaint, marginTop: 18 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  secondary: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  secondaryText: { fontSize: 14.5, fontWeight: '700', color: color.inkSoft },
  primary: { backgroundColor: color.brand, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  primaryText: { fontSize: 14.5, fontWeight: '700', color: '#FFFFFF' },
});
