import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { bundledHouseList, HOUSE_SECTION_LABEL, houseListSections, type HouseItem, type HouseItemKind, type HouseSection } from '@kiki/domain';
import { useSession } from '../api/session';
import { Pet, Garden, Request, Keys, Quiet, Mutual, type GlyphProps } from './glyphs';
import { haptic } from './feedback';
import { color } from '../theme/tokens';
import type { ComponentType } from 'react';

/**
 * A host's house list, read by a would-be guest. Three sections that mean three different things:
 * rules (what the host needs), things they'd love (kindness, not terms) and what a guest would be
 * looking after (commitments, agreed to when asking). Colour follows the design system: rust marks
 * a cost, gold the host's own voice, and the care items carry the one check a guest ticks.
 */
const KIND_GLYPH: Record<HouseItemKind, ComponentType<GlyphProps>> = {
  pet: Pet, plants: Garden, post: Request, home: Keys, quiet: Quiet, people: Mutual,
};
const SECTION_ACCENT: Record<HouseSection, string> = { rule: color.caveat, love: color.gold, care: color.brand };

/** The bundled list paints at once; the API's copy (which a host may have edited) replaces it. */
export function useHouseList(listingId: string | undefined): { items: HouseItem[]; live: boolean } {
  const { api } = useSession();
  const [state, setState] = useState<{ items: HouseItem[]; live: boolean }>(() => ({ items: listingId ? bundledHouseList(listingId) : [], live: false }));
  useEffect(() => {
    if (!listingId) return;
    let alive = true;
    setState({ items: bundledHouseList(listingId), live: false });
    api.listings.houseList.query({ listingId })
      .then((items) => { if (alive && Array.isArray(items)) setState({ items: items as HouseItem[], live: true }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [api, listingId]);
  return state;
}

function Line({ item, checked, onToggle }: { item: HouseItem; checked?: boolean; onToggle?: () => void }) {
  const G = item.kind ? KIND_GLYPH[item.kind] : undefined;
  const body = (
    <>
      <View style={styles.glyph}>{G ? <G size={18} color={color.inkSoft} accent={SECTION_ACCENT[item.section]} /> : <View style={[styles.dot, { backgroundColor: SECTION_ACCENT[item.section] }]} />}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.text}>{item.text}</Text>
        {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
      </View>
      {onToggle ? (
        <View style={[styles.check, checked ? styles.checkOn : styles.checkOff]}>{checked ? <Text style={styles.checkMark}>✓</Text> : null}</View>
      ) : null}
    </>
  );
  if (!onToggle) return <View style={styles.line}>{body}</View>;
  return (
    <Pressable
      onPress={() => { haptic.select(); onToggle(); }}
      style={({ pressed }) => [styles.line, styles.lineTappable, checked && styles.lineChecked, pressed && { opacity: 0.85 }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!checked }}
      accessibilityLabel={`I'll ${item.text.charAt(0).toLowerCase()}${item.text.slice(1)}`}
    >
      {body}
    </Pressable>
  );
}

/**
 * Read-only on a host's profile; with `agreed` + `onToggle` it becomes the commitments step of a
 * request, where each care item is ticked by the guest.
 */
export function HouseList({ items, agreed, onToggle, compact = false }: { items: HouseItem[]; agreed?: string[]; onToggle?: (id: string) => void; compact?: boolean }) {
  const v = houseListSections(items);
  if (items.length === 0) return <Text style={styles.empty}>No house list yet. Ask the host what matters to them.</Text>;
  const section = (key: HouseSection, list: HouseItem[]) =>
    list.length === 0 ? null : (
      <View key={key} style={styles.section}>
        <View style={styles.sectionHead}>
          <View style={[styles.rule, { backgroundColor: SECTION_ACCENT[key] }]} />
          <Text style={styles.sectionTitle}>{HOUSE_SECTION_LABEL[key].title}</Text>
        </View>
        {!compact ? <Text style={styles.hint}>{HOUSE_SECTION_LABEL[key].hint}</Text> : null}
        <View style={{ gap: 6 }}>
          {list.map((it) => (
            <Line key={it.id} item={it} checked={agreed?.includes(it.id)} onToggle={key === 'care' && onToggle ? () => onToggle(it.id) : undefined} />
          ))}
        </View>
      </View>
    );
  return (
    <View style={{ gap: 18 }}>
      {section('rule', v.rules)}
      {section('love', v.love)}
      {section('care', v.care)}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rule: { width: 3, height: 14, borderRadius: 2 },
  sectionTitle: { fontSize: 14.5, fontWeight: '700', color: color.ink, letterSpacing: -0.1 },
  hint: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint, marginTop: -2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  lineTappable: { paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: color.hairline, backgroundColor: color.surface },
  lineChecked: { borderColor: color.brand, backgroundColor: color.brandTint },
  glyph: { width: 22, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 14.5, lineHeight: 20, fontWeight: '600', color: color.ink },
  detail: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint, marginTop: 1 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  checkOn: { backgroundColor: color.brand, borderColor: color.brand },
  checkOff: { backgroundColor: 'transparent', borderColor: color.hairline },
  checkMark: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  empty: { fontSize: 14, color: color.inkSoft },
});

