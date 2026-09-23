import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { HOUSE_SECTION_LABEL, type HouseItem, type HouseSection } from '@kiki/domain';
import { useSession } from '../api/session';
import { useHouseList } from './HouseList';
import { haptic } from './feedback';
import { color, radius } from '../theme/tokens';

const SECTIONS: { key: HouseSection; chip: string; hint: string }[] = [
  { key: 'rule', chip: 'Rule', hint: 'e.g. No parties' },
  { key: 'love', chip: 'Would love', hint: 'e.g. A line in the guest book' },
  { key: 'care', chip: 'Looking after', hint: 'e.g. Feed Miso morning and evening' },
];
const ACCENT: Record<HouseSection, string> = { rule: color.caveat, love: color.gold, care: color.brand };

/**
 * Your own house list, on Me. Every add and remove is saved at once, like your facts. A change
 * never alters what an earlier guest agreed to: each request keeps the words it was sent with.
 */
export function HouseListEditor({ listingId }: { listingId: string }) {
  const { api } = useSession();
  const { items: loaded } = useHouseList(listingId);
  const [items, setItems] = useState<HouseItem[]>(loaded);
  const [adding, setAdding] = useState(false);
  const [section, setSection] = useState<HouseSection>('care');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setItems(loaded), [loaded]);

  const save = async (next: HouseItem[]) => {
    setBusy(true);
    setError(null);
    try {
      const saved = await api.listings.setHouseList.mutate({
        listingId,
        items: next.map(({ section: s, text: t, detail, kind }) => ({ section: s, text: t, ...(detail ? { detail } : {}), ...(kind ? { kind } : {}) })),
      });
      setItems(saved as HouseItem[]);
      return true;
    } catch {
      setError('Couldn’t save that. Try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    const t = text.trim();
    if (t.length < 2 || busy) return;
    const ok = await save([...items, { id: 'new', section, text: t }]);
    if (ok) { haptic.success(); setText(''); setAdding(false); }
  };
  const remove = (id: string) => { haptic.tap(); void save(items.filter((i) => i.id !== id)); };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>Your house list</Text>
        {!adding ? (
          <Pressable onPress={() => { haptic.select(); setAdding(true); }} hitSlop={8} accessibilityRole="button"><Text style={styles.addLink}>+ Add a line</Text></Pressable>
        ) : null}
      </View>
      <Text style={styles.note}>What you ask of whoever stays. Guests agree to each “looking after” line when they ask, and you see that they did.</Text>

      {SECTIONS.map(({ key }) => {
        const list = items.filter((i) => i.section === key);
        if (!list.length) return null;
        return (
          <View key={key} style={{ gap: 4 }}>
            <View style={styles.sectionHead}><View style={[styles.rule, { backgroundColor: ACCENT[key] }]} /><Text style={styles.sectionTitle}>{HOUSE_SECTION_LABEL[key].title}</Text></View>
            {list.map((it) => (
              <View key={it.id} style={styles.row}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.label}>{it.text}</Text>
                  {it.detail ? <Text style={styles.detail}>{it.detail}</Text> : null}
                </View>
                <Pressable onPress={() => remove(it.id)} disabled={busy} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${it.text}`}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        );
      })}
      {items.length === 0 ? <Text style={styles.note}>Nothing yet. A rule, a kindness, or something you’d like looked after.</Text> : null}

      {adding ? (
        <View style={styles.composer}>
          <View style={styles.kinds}>
            {SECTIONS.map((s) => (
              <Pressable key={s.key} onPress={() => { haptic.select(); setSection(s.key); }} style={[styles.chip, section === s.key && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: section === s.key }}>
                <Text style={[styles.chipText, section === s.key && styles.chipTextOn]}>{s.chip}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput style={styles.input} value={text} onChangeText={setText} placeholder={SECTIONS.find((s) => s.key === section)?.hint} placeholderTextColor={color.inkFaint} onSubmitEditing={add} returnKeyType="done" maxLength={120} autoFocus />
          <View style={styles.actions}>
            <Pressable onPress={() => { setAdding(false); setText(''); setError(null); }} hitSlop={8} accessibilityRole="button"><Text style={styles.cancel}>Cancel</Text></Pressable>
            <Pressable onPress={() => void add()} disabled={text.trim().length < 2 || busy} style={[styles.saveBtn, (text.trim().length < 2 || busy) && { opacity: 0.45 }]} accessibilityRole="button">
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Add</Text>}
            </Pressable>
          </View>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 17, fontWeight: '700', color: color.ink },
  addLink: { fontSize: 13.5, fontWeight: '700', color: color.brand },
  note: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rule: { width: 3, height: 13, borderRadius: 2 },
  sectionTitle: { fontSize: 13.5, fontWeight: '700', color: color.inkSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  label: { fontSize: 14.5, fontWeight: '600', color: color.ink },
  detail: { fontSize: 12, color: color.inkFaint, marginTop: 1 },
  remove: { fontSize: 12.5, fontWeight: '600', color: color.inkFaint },
  composer: { gap: 10, borderTopWidth: 1, borderTopColor: color.hairlineSoft, paddingTop: 12 },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: color.hairline, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: color.surface },
  chipOn: { borderColor: color.brand, backgroundColor: color.brandTint },
  chipText: { fontSize: 12.5, fontWeight: '700', color: color.inkSoft },
  chipTextOn: { color: color.textOnMint },
  input: { backgroundColor: color.bg, borderWidth: 1, borderColor: color.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: color.ink },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14 },
  cancel: { fontSize: 14, fontWeight: '600', color: color.inkFaint },
  saveBtn: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, minWidth: 64, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
  error: { fontSize: 12.5, color: color.caveat },
});
