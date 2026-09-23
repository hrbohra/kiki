import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { haptic } from '../../ui/feedback';
import { Avatar } from '../../ui/Avatar';
import { Loop } from '../../ui/Loop';
import { Hometown, Studied, Climb, Work, TRAIT_GLYPH } from '../../ui/glyphs';
import { WEB_SHADOW } from './webBits';
import { useResponsive } from '../../ui/useResponsive';
import { useSession } from '../../api/session';
import { useWorldRefresh } from '../../api/world-provider';
import { INVITE, ONBOARD_FACTS, ONBOARD_STEPS } from '../../domain/invite';
import { COVERS } from '../../domain/covers';
import { setOnboarded } from '../../demo/onboarding';
import { color } from '../../theme/tokens';
import * as world from '../../world';
import type { GlyphProps } from '../../ui/glyphs';
import type { ComponentType } from 'react';

import type { TraitKind } from '../../domain/types';

/** Onboarding facts use the same kinds as the Me page's facts editor, so an edit here and an
 *  edit there are the same write. */
const FACT_GLYPH: Record<TraitKind, ComponentType<GlyphProps>> = {
  origin: Hometown, education: Studied, interest: Climb, work: Work, event: TRAIT_GLYPH.event,
};
const ONBOARD_KIND = { hometown: 'origin', studied: 'education', climb: 'interest', work: 'work' } as const;
const ADD_KINDS: { kind: TraitKind; label: string; sub: string; hint: string }[] = [
  { kind: 'origin', label: 'Hometown', sub: 'Where you moved from', hint: 'e.g. Mount Eden' },
  { kind: 'education', label: 'Studied', sub: 'Where you studied', hint: 'Where, and the year' },
  { kind: 'work', label: 'Work', sub: 'What you do', hint: 'e.g. Product design' },
  { kind: 'interest', label: 'Interest', sub: 'Something you do', hint: 'A gym, a sport, a hobby' },
  { kind: 'event', label: 'Event', sub: 'Something you went to', hint: 'e.g. a festival, a run club' },
];

/** A fact as the person is shaping it. `saved` is the label already on the profile (from the
 *  invite), so an edit retires the old wording instead of leaving both behind. */
interface DraftFact { id: string; kind: TraitKind; label: string; sub: string; on: boolean; saved?: string }

const SUB: Record<TraitKind, string> = {
  origin: 'Where you moved from', education: 'Where you studied', interest: 'Something you do', work: 'What you do', event: 'Something you went to',
};

/** Start from what is actually on the profile, not from a script: your own stored facts, shown
 *  on, with their exact stored wording (so turning one off really removes it), then the invite's
 *  suggestions for any kind you have nothing for, shown off. Facts Kiki inferred are not yours to
 *  edit here; the Me page lists them, labelled. */
function initialFacts(): DraftFact[] {
  const mine = (world.memberById(world.viewerId)?.traits ?? []).filter((t) => (t.provenance ?? 'self_declared') === 'self_declared');
  const stored: DraftFact[] = mine.map((t, i) => ({
    id: `s${i}`, kind: t.kind, label: t.label, on: true, saved: t.label,
    sub: ONBOARD_FACTS.find((f) => ONBOARD_KIND[f.kind] === t.kind)?.sub ?? SUB[t.kind],
  }));
  const suggested: DraftFact[] = ONBOARD_FACTS
    .filter((f) => !mine.some((t) => t.kind === ONBOARD_KIND[f.kind]))
    .map((f, i) => ({ id: `g${i}`, kind: ONBOARD_KIND[f.kind], label: f.label, sub: f.sub, on: false }));
  return [...stored, ...suggested];
}
import type { RootNav } from '../../navigation';

/**
 * First-run invite / onboarding. Five steps, and the governing idea is that the invite is a
 * person, not a code — so the inviter leads, the honest step (what this costs you) is given the
 * same weight as the welcome, and what Kiki carries follows it in the same card grammar. Reachable again from the Me page's "How you got in" card.
 */
export function OnboardingWeb() {
  const navigation = useNavigation<RootNav>();
  const { isWide } = useResponsive();
  const { api } = useSession();
  const refreshWorld = useWorldRefresh();
  const [step, setStep] = useState(0);
  const [facts, setFacts] = useState<DraftFact[]>(initialFacts);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [adding, setAdding] = useState(false);
  const [addKind, setAddKind] = useState<TraitKind>('interest');
  const [addText, setAddText] = useState('');
  /** Real writes: every fact is written to (or removed from) your profile, so the overlaps other
   *  people see change with it. An edited fact retires its old wording first. */
  const syncFacts = () =>
    Promise.all(
      facts.map(async (f) => {
        if (f.saved && f.saved !== f.label) await api.members.setTrait.mutate({ kind: f.kind, label: f.saved, on: false }).catch(() => {});
        await api.members.setTrait.mutate({ kind: f.kind, label: f.label, on: f.on }).catch(() => {});
      }),
    )
      .then(() => refreshWorld())
      .catch(() => {});
  const toggle = (id: string) => { haptic.select(); setFacts((p) => p.map((x) => (x.id === id ? { ...x, on: !x.on } : x))); };
  const startEdit = (f: DraftFact) => { haptic.select(); setAdding(false); setEditing(f.id); setEditText(f.label); };
  const commitEdit = () => {
    const text = editText.trim().slice(0, 80);
    if (text) setFacts((p) => p.map((f) => (f.id === editing ? { ...f, label: text, on: true } : f)));
    setEditing(null);
  };
  const commitAdd = () => {
    const text = addText.trim().slice(0, 80);
    if (!text) return;
    const k = ADD_KINDS.find((x) => x.kind === addKind) ?? ADD_KINDS[0];
    haptic.success();
    setFacts((p) => [...p, { id: `n${Date.now()}`, kind: addKind, label: text, sub: k.sub, on: true }]);
    setAddText('');
    setAdding(false);
  };
  const inviter = world.memberById(INVITE.fromId);
  const last = ONBOARD_STEPS.length - 1;
  const done = () => { haptic.success(); setOnboarded(); navigation.popToTop(); };
  const nextLabel = step === 0 ? 'Accept the invite' : step === 1 ? 'Looks right' : 'I understand';
  const sharedCount = facts.filter((f) => f.on).length;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, !isWide && styles.scrollPhone]} showsVerticalScrollIndicator={false}>
        <View style={[styles.shell, !isWide && styles.shellPhone]}>
          {/* numbered rail on wide screens; on a phone a slim progress bar, so the step itself is above the fold */}
          {!isWide ? (
            <View style={styles.progress}>
              <View style={styles.wordmark}><Loop size={26} color={color.brand} opacity={1} strokeWidth={9} /><Text style={styles.brand}>Kiki</Text></View>
              <View style={styles.segments} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: ONBOARD_STEPS.length, now: step + 1 }}>
                {ONBOARD_STEPS.map((st, i) => <View key={st.key} style={[styles.segment, i <= step && styles.segmentOn]} />)}
              </View>
              <Text style={styles.progressLabel}>Step {step + 1} of {ONBOARD_STEPS.length} · {ONBOARD_STEPS[step].label}</Text>
            </View>
          ) : null}
          <View style={[styles.rail, !isWide && { display: 'none' }]}>
            <View style={styles.wordmark}><Loop size={30} color={color.brand} opacity={1} strokeWidth={9} /><Text style={styles.brand}>Kiki</Text></View>
            {ONBOARD_STEPS.map((st, i) => {
              const reached = i <= step;
              return (
                <View key={st.key} style={styles.railItem}>
                  <View style={styles.gutter}>
                    <View style={[styles.dot, reached ? styles.dotOn : styles.dotOff]}>
                      <Text style={[styles.dotNum, reached ? styles.dotNumOn : styles.dotNumOff]}>{i + 1}</Text>
                    </View>
                    {i < last ? <View style={[styles.connector, i < step && styles.connectorDone]} /> : null}
                  </View>
                  <Text style={[styles.railLabel, i === step && styles.railLabelActive]}>{st.label}</Text>
                </View>
              );
            })}
          </View>

          {/* step card + footer */}
          <View style={styles.right}>
            {step === 0 ? (
              <View style={[styles.card, styles.stepCard, !isWide && styles.stepCardPhone]}>
                <Text style={styles.eyebrow}>YOUR INVITE</Text>
                <View style={styles.inviterRow}>
                  <View style={styles.inviterAv}>
                    <Avatar id={inviter.id} name={inviter.name} tint={inviter.avatarColor} country={inviter.country} size={64} />
                    <View style={styles.inviterBadge}><Loop size={14} color="#FFFFFF" opacity={1} strokeWidth={10} /></View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h1}>{INVITE.fromName} let you in.</Text>
                    <Text style={styles.muted}>Sent {INVITE.sent}</Text>
                  </View>
                </View>
                <Text style={styles.body}>Kiki has no waitlist and no application. The only way in is that someone already here put their name next to yours — and that name stays attached.</Text>
                <View style={styles.quoteCard}>
                  <Text style={styles.quoteHead}>What {INVITE.fromName} wrote</Text>
                  <Text style={styles.quoteText}>“{INVITE.quote}”</Text>
                </View>
                <View style={styles.codeRow}>
                  <Text style={styles.codeLabel}>Invite code</Text>
                  <View style={styles.codeChip}><Text style={styles.codeChipText}>{INVITE.code}</Text></View>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.codeNote}>The code is just plumbing. The person is the invite.</Text>
                </View>
              </View>
            ) : step === 1 ? (
              <View style={[styles.card, styles.stepCard, !isWide && styles.stepCardPhone]}>
                <Text style={styles.h1}>What you bring</Text>
                <Text style={styles.body}>These are the facts we match you on. Share only what you want strangers to find you by, and fix the wording if it isn’t quite you. You can change any of it later from your profile, and we will always label what we worked out ourselves.</Text>
                <View style={{ gap: 10, alignSelf: 'stretch' }}>
                  {facts.map((f) => {
                    const on = f.on;
                    const Glyph = FACT_GLYPH[f.kind];
                    if (editing === f.id) {
                      return (
                        <View key={f.id} style={[styles.factRow, styles.factEditing]}>
                          <Glyph size={24} color={color.ink} accent={color.brand} />
                          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                            <TextInput
                              style={styles.factInput}
                              value={editText}
                              onChangeText={setEditText}
                              onSubmitEditing={commitEdit}
                              returnKeyType="done"
                              maxLength={80}
                              autoFocus
                              accessibilityLabel={`Edit: ${f.sub}`}
                            />
                            <Text style={styles.factSub}>{f.sub}</Text>
                          </View>
                          <Pressable onPress={commitEdit} hitSlop={8} accessibilityRole="button" style={styles.factDone}>
                            <Text style={styles.factDoneText}>Done</Text>
                          </Pressable>
                        </View>
                      );
                    }
                    return (
                      <View key={f.id} style={[styles.factRow, on ? styles.factOn : styles.factOff]}>
                        <Pressable
                          onPress={() => toggle(f.id)}
                          style={styles.factToggle}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: on }}
                          accessibilityLabel={`${f.label}, ${f.sub}`}
                        >
                          <Glyph size={24} color={color.ink} accent={color.brand} />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={[styles.factLabel, on && styles.factLabelOn]}>{f.label}</Text>
                            <Text style={styles.factSub}>{f.sub}</Text>
                          </View>
                        </Pressable>
                        <Pressable onPress={() => startEdit(f)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Edit ${f.label}`} style={styles.factEdit}>
                          <Text style={styles.factEditText}>Edit</Text>
                        </Pressable>
                        <Pressable onPress={() => toggle(f.id)} hitSlop={8} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                          <View style={[styles.check, on ? styles.checkOn : styles.checkOff]}>{on ? <Text style={styles.checkMark}>✓</Text> : null}</View>
                        </Pressable>
                      </View>
                    );
                  })}
                  {adding ? (
                    <View style={styles.addCard}>
                      <View style={styles.kinds}>
                        {ADD_KINDS.map((k) => (
                          <Pressable key={k.kind} onPress={() => { haptic.select(); setAddKind(k.kind); }} style={[styles.kindChip, addKind === k.kind && styles.kindChipOn]} accessibilityRole="button" accessibilityState={{ selected: addKind === k.kind }}>
                            <Text style={[styles.kindText, addKind === k.kind && styles.kindTextOn]}>{k.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <TextInput
                        style={styles.factInput}
                        value={addText}
                        onChangeText={setAddText}
                        placeholder={ADD_KINDS.find((k) => k.kind === addKind)?.hint}
                        placeholderTextColor={color.inkFaint}
                        onSubmitEditing={commitAdd}
                        returnKeyType="done"
                        maxLength={80}
                        autoFocus
                      />
                      <View style={styles.addActions}>
                        <Pressable onPress={() => { setAdding(false); setAddText(''); }} hitSlop={8} accessibilityRole="button"><Text style={styles.addCancel}>Cancel</Text></Pressable>
                        <Pressable onPress={commitAdd} disabled={!addText.trim()} style={[styles.addSave, !addText.trim() && styles.addSaveOff]} accessibilityRole="button">
                          <Text style={styles.addSaveText}>Add</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable onPress={() => { haptic.select(); setEditing(null); setAdding(true); }} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
                      <Text style={styles.addLink}>+ Add a fact</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.footNote}>{sharedCount} shared. A shared fact is not a safety signal — it is just something to open with.</Text>
              </View>
            ) : step === 2 ? (
              <View style={[styles.card, styles.stepCard, !isWide && styles.stepCardPhone]}>
                <Text style={styles.h1}>What this costs you</Text>
                <Text style={styles.body}>Three things are true from the moment you join. None of them are in a terms page.</Text>
                <View style={{ gap: 12 }}>
                  {[
                    `${INVITE.fromName}’s name is on yours. If you damage someone’s flat, the person who let you in wears part of that. She can also see that you joined.`,
                    'You start with nothing. No stays, no guest book, no one who can speak for you. Hosts will see that, and some will say no. That is the system working.',
                    'What you write about people stays attached to your name. There are no anonymous reviews here.',
                  ].map((t, i) => (
                    <View key={i} style={styles.stakeCard}>
                      <View style={styles.stakeRule} />
                      <Text style={styles.stakeText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : step === 3 ? (
              <View style={[styles.card, styles.stepCard, !isWide && styles.stepCardPhone]}>
                <Text style={styles.eyebrow}>{COVERS.eyebrow}</Text>
                <Text style={styles.h1}>{COVERS.title}</Text>
                <Text style={styles.body}>{COVERS.sub}</Text>
                <View style={{ gap: 12, alignSelf: 'stretch' }}>
                  {COVERS.items.map((c) => (
                    <View key={c.title} style={styles.coverCard}>
                      <Text style={styles.coverTitle}>{c.title}</Text>
                      <Text style={styles.coverBody}>{c.body}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.footNote}>{COVERS.footnote}</Text>
              </View>
            ) : (
              <View style={[styles.card, styles.stepCard, !isWide && styles.stepCardPhone]}>
                <View style={styles.doneCircle}><Loop size={24} color={color.brand} opacity={1} strokeWidth={9} /></View>
                <Text style={styles.h1}>You’re in.</Text>
                <Text style={styles.body}>You are one step from {INVITE.fromName} and two steps from eleven other people. That is your whole network today, and it is enough to start.</Text>
                <View style={styles.statList}>
                  <Stat n="1" label={`person can vouch for you today — ${INVITE.fromName}`} />
                  <Stat n="6" label="homes are within two steps of you" />
                  <Stat n="0" label="stays behind you, which every host will see" />
                </View>
                <Text style={styles.footNote}>The fastest way to change the last number is to host before you travel.</Text>
              </View>
            )}

            {/* footer controls */}
            <View style={styles.footer}>
              {step > 0 ? <Pressable style={styles.backBtn} onPress={() => setStep((s) => s - 1)}><Text style={styles.backText}>Back</Text></Pressable> : null}
              <Pressable style={styles.primary} onPress={() => { if (step === last) done(); else { haptic.select(); if (step === 1) void syncFacts(); setStep((s) => s + 1); } }}>
                <Text style={styles.primaryText}>{step === last ? 'Start exploring' : nextLabel}</Text>
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable onPress={done}><Text style={styles.skip}>Skip — I’ll read it later</Text></Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return <View style={styles.statRow}><Text style={styles.statNum}>{n}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  progress: { gap: 10, alignSelf: 'stretch', paddingTop: 4 },
  segments: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: color.hairline },
  segmentOn: { backgroundColor: color.brand },
  progressLabel: { fontSize: 13, fontWeight: '700', color: color.inkSoft },
  root: { flex: 1, backgroundColor: color.screen },
  scroll: { paddingVertical: 40, minHeight: '100%' },
  scrollPhone: { paddingVertical: 24 },
  shell: { maxWidth: 1040, width: '100%', alignSelf: 'center', paddingHorizontal: 40, flexDirection: 'row', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' },
  shellPhone: { paddingHorizontal: 16, gap: 24 },

  rail: { width: 200, gap: 4 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  brand: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  railItem: { flexDirection: 'row', gap: 12 },
  gutter: { width: 24, alignItems: 'center' },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dotOn: { backgroundColor: color.brand, borderColor: color.brand },
  dotOff: { backgroundColor: color.surface, borderColor: color.hairline },
  dotNum: { fontSize: 12, fontWeight: '700' },
  dotNumOn: { color: '#FFFFFF' },
  dotNumOff: { color: color.inkFaint },
  connector: { flex: 1, width: 2, minHeight: 22, backgroundColor: color.hairline, marginVertical: 3 },
  connectorDone: { backgroundColor: color.brand },
  railLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: color.inkFaint, paddingTop: 2, paddingBottom: 14 },
  railLabelActive: { fontWeight: '700', color: color.ink },

  right: { flexGrow: 1, flexShrink: 1, flexBasis: 520, minWidth: 0, gap: 16 },
  card: { backgroundColor: color.surface, borderRadius: 20, ...WEB_SHADOW },
  stepCard: { padding: 32, gap: 14, alignItems: 'flex-start' },
  stepCardPhone: { padding: 20 },
  eyebrow: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.8, color: color.inkFaint },
  inviterRow: { flexDirection: 'row', alignItems: 'center', gap: 14, alignSelf: 'stretch' },
  inviterAv: { width: 64, height: 64 },
  inviterBadge: { position: 'absolute', left: 0, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 27, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6, color: color.ink },
  muted: { fontSize: 14, lineHeight: 20, color: color.inkFaint, marginTop: 2 },
  body: { fontSize: 15, lineHeight: 22, color: color.ink },
  quoteCard: { alignSelf: 'stretch', backgroundColor: color.brandTint, borderRadius: 14, padding: 16, paddingHorizontal: 18, gap: 6 },
  quoteHead: { fontSize: 13.5, lineHeight: 19, fontWeight: '700', color: color.textOnMint },
  quoteText: { fontSize: 15, lineHeight: 22, color: color.textOnMint },
  codeRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: color.hairlineSoft, paddingTop: 14 },
  codeLabel: { fontSize: 12.5, color: color.inkFaint },
  codeChip: { backgroundColor: color.bg, borderWidth: 1, borderColor: color.hairline, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  codeChipText: { fontSize: 12.5, fontWeight: '700', color: color.inkSoft, letterSpacing: 0.4 },
  codeNote: { fontSize: 12.5, color: color.inkFaint },

  factRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, alignSelf: 'stretch' },
  factOn: { backgroundColor: color.brandTint, borderColor: color.brand },
  factOff: { backgroundColor: color.surface, borderColor: color.hairline },
  factIcon: { fontSize: 19 },
  factLabel: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: color.ink },
  factLabelOn: { color: color.textOnMint },
  factSub: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  checkOn: { backgroundColor: color.brand, borderColor: color.brand },
  checkOff: { backgroundColor: 'transparent', borderColor: color.hairline },
  checkMark: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  footNote: { fontSize: 12.5, lineHeight: 18, color: color.inkFaint },
  factToggle: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14 },
  factEdit: { paddingVertical: 4, paddingHorizontal: 6 },
  factEditText: { fontSize: 12.5, fontWeight: '700', color: color.textOnMint },
  factEditing: { backgroundColor: color.surface, borderColor: color.brand },
  factInput: { fontSize: 15, fontWeight: '700', color: color.ink, backgroundColor: color.bg, borderWidth: 1, borderColor: color.hairline, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, alignSelf: 'stretch' },
  factDone: { backgroundColor: color.brand, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  factDoneText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  addLink: { fontSize: 14, fontWeight: '700', color: color.brand, paddingVertical: 4 },
  addCard: { gap: 10, borderRadius: 14, borderWidth: 1, borderColor: color.hairline, backgroundColor: color.surface, padding: 14, alignSelf: 'stretch' },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kindChip: { borderWidth: 1, borderColor: color.hairline, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: color.surface },
  kindChipOn: { borderColor: color.brand, backgroundColor: color.brandTint },
  kindText: { fontSize: 12.5, fontWeight: '700', color: color.inkSoft },
  kindTextOn: { color: color.textOnMint },
  addActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14 },
  addCancel: { fontSize: 14, fontWeight: '600', color: color.inkFaint },
  addSave: { backgroundColor: color.brand, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
  addSaveOff: { opacity: 0.45 },
  addSaveText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  stakeCard: { backgroundColor: color.bg, borderRadius: 14, padding: 16, paddingLeft: 21, overflow: 'hidden', alignSelf: 'stretch' },
  stakeRule: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.caveat },
  stakeText: { fontSize: 15, lineHeight: 22, color: color.ink },

  coverCard: { backgroundColor: color.surface, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: color.hairline, alignSelf: 'stretch', gap: 4 },
  coverTitle: { fontSize: 16, fontWeight: '700', color: color.ink },
  coverBody: { fontSize: 14, lineHeight: 20, color: color.inkSoft },
  doneCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.brandTint, alignItems: 'center', justifyContent: 'center' },
  statList: { alignSelf: 'stretch', gap: 10 },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  statNum: { width: 26, fontSize: 20, lineHeight: 21, fontWeight: '700', color: color.ink },
  statLabel: { flex: 1, fontSize: 14.5, lineHeight: 21, color: color.inkSoft },

  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  backBtn: { borderWidth: 1, borderColor: color.hairline, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 13 },
  backText: { fontSize: 14.5, fontWeight: '700', color: color.inkSoft },
  primary: { backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 26, paddingVertical: 13 },
  primaryText: { fontSize: 14.5, fontWeight: '700', color: '#FFFFFF' },
  skip: { fontSize: 13, fontWeight: '700', color: color.inkFaint },
});
