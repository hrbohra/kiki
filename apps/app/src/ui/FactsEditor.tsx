import { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { TRAIT_GLYPH } from './glyphs';
import { haptic } from './feedback';
import { useSession } from '../api/session';
import { useWorldRefresh } from '../api/world-provider';
import { color, radius, space } from '../theme/tokens';
import type { Trait, TraitKind } from '../domain/types';

/**
 * Your own facts — the things Kiki matches you on ("you both climb at Blok Shoreditch"). Every
 * fact is labelled with how it was established, as the Trust page promises about other people,
 * and you can add or remove your own. Adding a fact that someone else already declared reuses
 * their canonical key server-side, so the overlap appears on both sides at once.
 */
const KINDS: { kind: TraitKind; label: string; hint: string }[] = [
  { kind: 'origin', label: 'Hometown', hint: 'Where you moved from' },
  { kind: 'education', label: 'Studied', hint: 'Where, and the year' },
  { kind: 'work', label: 'Work', hint: 'What you do' },
  { kind: 'interest', label: 'Interest', hint: 'A gym, a sport, a hobby' },
  { kind: 'event', label: 'Event', hint: 'Something you went to' },
];

const PROVENANCE: Record<string, string> = {
  self_declared: 'Your words',
  inferred: 'We worked it out',
  matched: 'Matched',
};

export function FactsEditor({ traits, title = 'What you’re matched on', compact = false }: { traits: Trait[]; title?: string; compact?: boolean }) {
  const { api } = useSession();
  const refresh = useWorldRefresh();
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<TraitKind>('interest');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const text = label.trim();
    if (!text || busy) return;
    setBusy('add');
    setError(null);
    try {
      await api.members.setTrait.mutate({ kind, label: text, on: true });
      haptic.success();
      setLabel('');
      setAdding(false);
      await refresh();
    } catch {
      setError("Couldn't save that. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (t: Trait) => {
    if (busy) return;
    setBusy(t.key);
    setError(null);
    try {
      await api.members.setTrait.mutate({ kind: t.kind, label: t.label, on: false });
      haptic.tap();
      await refresh();
    } catch {
      setError("Couldn't remove that. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={compact ? styles.titleCompact : styles.title}>{title}</Text>
        {!adding ? (
          <Pressable onPress={() => { haptic.select(); setAdding(true); }} hitSlop={8} accessibilityRole="button">
            <Text style={styles.addLink}>+ Add a fact</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.note}>Everything others can see, and how it was established. Nothing is silently inferred.</Text>

      {traits.length === 0 ? <Text style={styles.empty}>Nothing yet. Add what you'd like strangers to find you by.</Text> : null}
      {traits.map((t) => {
        const G = TRAIT_GLYPH[t.kind];
        const own = (t.provenance ?? 'self_declared') === 'self_declared';
        return (
          <View key={t.key} style={styles.row}>
            {G ? <G size={18} color={color.inkSoft} accent={color.brand} /> : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.label}>{clean(t.label)}</Text>
              <Text style={styles.prov}>{PROVENANCE[t.provenance ?? 'self_declared'] ?? 'Your words'}</Text>
            </View>
            {own ? (
              busy === t.key ? (
                <ActivityIndicator color={color.inkFaint} />
              ) : (
                <Pressable onPress={() => void remove(t)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${t.label}`} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              )
            ) : null}
          </View>
        );
      })}

      {adding ? (
        <View style={styles.composer}>
          <View style={styles.kinds}>
            {KINDS.map((k) => (
              <Pressable key={k.kind} onPress={() => { haptic.select(); setKind(k.kind); }} style={[styles.kindChip, kind === k.kind && styles.kindChipOn]} accessibilityRole="button">
                <Text style={[styles.kindText, kind === k.kind && styles.kindTextOn]}>{k.label}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder={KINDS.find((k) => k.kind === kind)?.hint}
            placeholderTextColor={color.inkFaint}
            onSubmitEditing={save}
            returnKeyType="done"
            autoFocus
          />
          <View style={styles.actions}>
            <Pressable onPress={() => { setAdding(false); setLabel(''); setError(null); }} hitSlop={8} accessibilityRole="button"><Text style={styles.cancel}>Cancel</Text></Pressable>
            <Pressable onPress={() => void save()} disabled={!label.trim() || busy === 'add'} style={[styles.saveBtn, (!label.trim() || busy === 'add') && styles.saveDisabled]} accessibilityRole="button">
              {busy === 'add' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Add</Text>}
            </Pressable>
          </View>
          <Text style={styles.composerNote}>Shown to people reading your trust page, labelled as your words.</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function clean(label: string): string {
  return label.replace(/^the /, '').replace(/^bouldering at /, 'bouldering at ');
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 17, fontWeight: '700', color: color.ink },
  titleCompact: { fontSize: 15, fontWeight: '700', color: color.ink },
  addLink: { fontSize: 13.5, fontWeight: '700', color: color.brand },
  note: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint, marginTop: -4 },
  empty: { fontSize: 14, color: color.inkSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  label: { fontSize: 14.5, fontWeight: '600', color: color.ink },
  prov: { fontSize: 11.5, color: color.inkFaint, marginTop: 1 },
  removeBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  removeText: { fontSize: 12.5, fontWeight: '600', color: color.inkFaint },
  composer: { gap: 10, borderTopWidth: 1, borderTopColor: color.hairlineSoft, paddingTop: 12 },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kindChip: { borderWidth: 1, borderColor: color.hairline, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: color.surface },
  kindChipOn: { borderColor: color.brand, backgroundColor: color.brandTint },
  kindText: { fontSize: 12.5, fontWeight: '700', color: color.inkSoft },
  kindTextOn: { color: color.textOnMint },
  input: { backgroundColor: color.bg, borderWidth: 1, borderColor: color.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: color.ink },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14 },
  cancel: { fontSize: 14, fontWeight: '600', color: color.inkFaint },
  saveBtn: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, minWidth: 64, alignItems: 'center' },
  saveDisabled: { opacity: 0.45 },
  saveText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
  composerNote: { fontSize: 12, color: color.inkFaint },
  error: { fontSize: 12.5, color: color.caveat },
});
