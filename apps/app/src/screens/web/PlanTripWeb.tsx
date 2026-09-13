import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Platform, View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';

import { color } from '../../theme/tokens';
import { Dates } from '../../ui/glyphs';
import { TRIP_KINDS, shortDate, nightsBetween, type Trip } from '../../domain/trips';
import { setCreatedTrip } from '../../demo/createdTrip';
import { WEB_SHADOW } from './webBits';

import type { RootNav } from '../../navigation';

interface Draft {
  name: string;
  start: string;
  end: string;
  budget: string;
  icon: string;
}

const DRAFT_DEFAULT: Draft = { name: '', start: '2027-06-07', end: '2027-06-20', budget: '40', icon: TRIP_KINDS[0] };

/** Create-a-trip: you post a trip and hosts come to you. Nights and total are derived, never
 *  typed; a live preview shows exactly what a host will see; posting builds the trip and opens
 *  its (empty) offers screen. */
export function PlanTripWeb() {
  const navigation = useNavigation<RootNav>();
  const [draft, setDraft] = useState<Draft>(DRAFT_DEFAULT);
  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const nights = nightsBetween(draft.start, draft.end);
  const total = nights ? `£${nights * Number(draft.budget || 0)}` : '—';
  const named = draft.name.trim().length > 0;
  const valid = nights > 0 && named;
  const blockedWhy = !named ? 'Give the trip a name first.' : 'Pick an end date after your start date.';

  const previewName = draft.name.trim() || 'Untitled trip';
  const previewMeta = nights
    ? `${shortDate(draft.start)} - ${shortDate(draft.end)} · ${nights} ${nights === 1 ? 'night' : 'nights'} · £${draft.budget} / night`
    : 'Pick an end date after your start date';

  const post = () => {
    const trip: Trip = {
      id: 'created', name: draft.name.trim(), icon: draft.icon,
      dates: `${shortDate(draft.start)} - ${shortDate(draft.end)}`,
      nights, budget: Number(draft.budget || 0), offers: [],
    };
    setCreatedTrip(trip);
    navigation.replace('TripOffers', { tripId: 'created' });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.col}>
          <View style={styles.titleRow}>
            <Pressable style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back"><Text style={styles.backGlyph}>←</Text></Pressable>
            <Text style={styles.title}>Plan a trip</Text>
          </View>
          <Text style={styles.intro}>Say where you're going and what you can pay. Hosts within your network come to you — you don't apply to them.</Text>

          <View style={[styles.card, styles.formCard]}>
            <Field label="What's the trip?">
              <TextInput value={draft.name} onChangeText={(v) => patch({ name: v })} placeholder="Italy bday trip" placeholderTextColor={color.inkFaint} style={styles.input} />
            </Field>

            <View style={styles.dateRow}>
              <Field label="Arrive" style={styles.dateField}>
                <DateInput value={draft.start} onChange={(v) => patch({ start: v })} />
              </Field>
              <Field label="Leave" style={styles.dateField}>
                <DateInput value={draft.end} onChange={(v) => patch({ end: v })} />
              </Field>
            </View>

            <Field label="What you can pay, per night">
              <View style={styles.budgetWell}>
                <Text style={styles.budgetSign}>£</Text>
                <TextInput value={draft.budget} onChangeText={(v) => patch({ budget: v.replace(/[^0-9]/g, '') })} keyboardType="numeric" style={styles.budgetInput} />
                <Text style={styles.budgetMeta}>{nights} nights · {total} total</Text>
              </View>
              <Text style={styles.hint}>Hosts see this figure. Offers are never ranked by it.</Text>
            </Field>

            <Field label="Kind">
              <View style={styles.iconRow}>
                {TRIP_KINDS.map((ic) => {
                  const on = draft.icon === ic;
                  return (
                    <Pressable key={ic} onPress={() => patch({ icon: ic })} style={[styles.kindChip, on ? styles.iconOn : styles.iconOff]}>
                      <Text style={[styles.kindChipText, on && styles.kindChipTextOn]}>{ic}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
          </View>

          <Text style={styles.previewLabel}>How it will look to hosts</Text>
          <View style={[styles.card, styles.previewCard]}>
            <View style={styles.previewIconTile}><Dates size={26} color={color.ink} /></View>
            <Text style={styles.previewName}>{previewName}</Text>
            <Text style={styles.previewMeta}>{previewMeta}</Text>
          </View>

          <View style={styles.caution}>
            <View style={styles.cautionRule} />
            <Text style={styles.cautionTitle}>Before you post</Text>
            <Text style={styles.cautionBody}>Everyone within two steps of you can see this trip and your name on it. Most offers will cover part of your dates, not all of them, and you may get none at all.</Text>
          </View>

          <View style={styles.actions}>
            {valid ? (
              <Pressable style={styles.post} onPress={post}><Text style={styles.postText}>Post this trip</Text></Pressable>
            ) : (
              <>
                <View style={styles.postDisabled}><Text style={styles.postDisabledText}>Post this trip</Text></View>
                <Text style={styles.blockedWhy}>{blockedWhy}</Text>
              </>
            )}
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, style, children }: { label: string; style?: any; children: React.ReactNode }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

/** A real date picker on web (DOM input), a plain ISO text field on native. */
function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value,
      onChange: (e: any) => onChange(e.target.value),
      style: { width: '100%', boxSizing: 'border-box', background: '#F5F5F4', border: '1px solid #ECECE8', borderRadius: '12px', padding: '12px 15px', font: 'inherit', fontSize: '15px', color: '#1A1A1A', outline: 'none' },
    });
  }
  return <TextInput value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" placeholderTextColor={color.inkFaint} style={styles.input} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.screen },
  scroll: { paddingVertical: 40, paddingHorizontal: 20 },
  col: { maxWidth: 620, width: '100%', alignSelf: 'center', gap: 18 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: color.hairline, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontSize: 15, color: color.inkSoft },
  title: { fontSize: 24, lineHeight: 31, fontWeight: '700', letterSpacing: -0.5, color: color.ink },
  intro: { fontSize: 15, lineHeight: 22, color: color.inkSoft },

  card: { backgroundColor: color.surface, borderRadius: 20, ...WEB_SHADOW },
  formCard: { padding: 20, gap: 18 },
  field: { gap: 7 },
  fieldLabel: { fontSize: 13, lineHeight: 19, fontWeight: '700', color: color.inkSoft },
  input: { backgroundColor: color.screen, borderWidth: 1, borderColor: color.hairline, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 13, fontSize: 15, lineHeight: 22, color: color.ink },
  dateRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  dateField: { flexGrow: 1, flexBasis: 150, minWidth: 0 },
  budgetWell: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: color.screen, borderWidth: 1, borderColor: color.hairline, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 13 },
  budgetSign: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: color.inkFaint },
  budgetInput: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 22, color: color.ink },
  budgetMeta: { fontSize: 13, lineHeight: 19, color: color.inkFaint },
  hint: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
  iconRow: { flexDirection: 'row', gap: 9, flexWrap: 'wrap' },
  iconTile: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconOn: { backgroundColor: color.brandTint, borderColor: color.brand },
  iconOff: { backgroundColor: color.surface, borderColor: color.hairline },
  kindChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  kindChipText: { fontSize: 13.5, fontWeight: '700', color: color.inkSoft },
  kindChipTextOn: { color: color.textOnMint },
  iconGlyph: { fontSize: 23 },

  previewLabel: { fontSize: 13, lineHeight: 19, fontWeight: '700', color: color.inkSoft, paddingHorizontal: 4 },
  previewCard: { padding: 20, alignItems: 'center', gap: 10 },
  previewIconTile: { width: 58, height: 58, borderRadius: 16, backgroundColor: color.hairlineSoft, alignItems: 'center', justifyContent: 'center' },
  previewIcon: { fontSize: 27 },
  previewName: { fontSize: 24, lineHeight: 31, fontWeight: '700', letterSpacing: -0.5, color: color.ink, textAlign: 'center' },
  previewMeta: { fontSize: 14, lineHeight: 20, color: color.inkSoft, textAlign: 'center' },

  caution: { backgroundColor: color.surface, borderRadius: 20, padding: 20, paddingLeft: 23, gap: 8, overflow: 'hidden', ...WEB_SHADOW },
  cautionRule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  cautionTitle: { fontSize: 13.5, lineHeight: 19, fontWeight: '700', color: color.caveat },
  cautionBody: { fontSize: 14.5, lineHeight: 21, color: color.ink },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  post: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 26, paddingVertical: 14 },
  postText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  postDisabled: { backgroundColor: color.hairlineSoft, borderRadius: 12, paddingHorizontal: 26, paddingVertical: 14 },
  postDisabledText: { fontSize: 15, fontWeight: '700', color: '#8A9099' },
  blockedWhy: { fontSize: 13, lineHeight: 19, color: color.inkFaint },
  cancel: { fontSize: 13, fontWeight: '700', color: color.inkFaint },
});
