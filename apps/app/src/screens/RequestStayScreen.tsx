import { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { commitmentsProblem, WORLD_NOW_DAY } from '@kiki/domain';
import * as world from '../world';
import { useSession } from '../api/session';
import { HouseList, useHouseList } from '../ui/HouseList';
import { photoFor } from '../ui/listingPhotos';
import { haptic } from '../ui/feedback';
import { relRange } from '../domain/relDates';
import { stayLength } from '../domain/stay';
import { money } from '../domain/format';
import { color } from '../theme/tokens';
import { WEB_SHADOW } from './web/webBits';
import type { StackProps } from '../navigation';

const START_IN = 18;
const NIGHTS = 14;

/**
 * Asking to stay. The guest reads the host's house list, ticks each thing they'd be looking after
 * (a commitment, not a formality), adds a line of their own, and sends a real request. The host's
 * Requests card then says, in words, what this guest agreed to. The API checks the same rule the
 * send button does, so the two can never disagree.
 */
export function RequestStayScreen({ route, navigation }: StackProps<'RequestStay'>) {
  const { api } = useSession();
  const listing = world.listingById(route.params.listingId);
  const host = world.hostOf(listing);
  const { items } = useHouseList(listing.id);
  const [agreed, setAgreed] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const idem = useRef(`stay-${listing.id}-${Date.now().toString(36)}`).current;

  const problem = useMemo(() => commitmentsProblem(items, agreed), [items, agreed]);
  const careCount = items.filter((i) => i.section === 'care').length;
  const toggle = (id: string) => setAgreed((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const send = async () => {
    if (problem || state !== 'idle') return;
    setState('sending');
    setError(null);
    try {
      await api.requests.create.mutate({
        listingId: listing.id,
        fromDay: WORLD_NOW_DAY + START_IN,
        toDay: WORLD_NOW_DAY + START_IN + NIGHTS,
        message: message.trim() || undefined,
        commitments: agreed,
        idempotencyKey: idem,
      });
      haptic.success();
      setState('sent');
    } catch (e) {
      setState('idle');
      setError(e instanceof Error && e.message ? e.message : 'That didn’t send. Try again in a moment.');
    }
  };

  if (state === 'sent') {
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.col}>
            <View style={[styles.card, styles.sentCard]}>
              <Text style={styles.sentEyebrow}>REQUEST SENT</Text>
              <Text style={styles.sentTitle}>{host.name} has your request.</Text>
              <Text style={styles.body}>
                {careCount > 0
                  ? `Alongside your dates, ${host.name} sees that you agreed to ${careCount === 1 ? 'the one thing' : careCount === 2 ? 'both things' : `all ${careCount} things`} you’d be looking after. There is no timer on their answer.`
                  : `There is no timer on ${host.name}’s answer. A message while they decide is always welcome.`}
              </Text>
              <View style={styles.actions}>
                <Pressable style={styles.primary} onPress={() => navigation.replace('Thread', { memberId: host.id })}><Text style={styles.primaryText}>Message {host.name}</Text></Pressable>
                <Pressable style={styles.quiet} onPress={() => navigation.goBack()}><Text style={styles.quietText}>Done</Text></Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.col}>
          <View style={styles.titleRow}>
            <Pressable style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back"><Text style={styles.backGlyph}>←</Text></Pressable>
            <Text style={styles.title}>Ask to stay at {host.name}’s</Text>
          </View>

          <View style={[styles.card, styles.stayCard]}>
            <View style={[styles.thumb, { backgroundColor: listing.photoColor }]}>
              <Image source={photoFor(listing.id)} style={StyleSheet.absoluteFill} resizeMode="cover" />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={styles.stayTitle} numberOfLines={1}>{listing.title}</Text>
              <Text style={styles.stayMeta}>{relRange(START_IN, NIGHTS)} · {stayLength(NIGHTS)}</Text>
              <Text style={styles.stayMeta}>{money(listing.pricePerNight)} / night · {money(listing.pricePerNight * NIGHTS)} in all</Text>
            </View>
          </View>

          <View style={[styles.card, styles.pad]}>
            <Text style={styles.cardTitle}>{host.name}’s house list</Text>
            <Text style={styles.body}>{careCount > 0 ? `Read it through, then tick what you’d be looking after. ${host.name} sees that you did.` : 'Read it through before you ask. Asking means you’re happy with it.'}</Text>
            <View style={{ marginTop: 14 }}>
              <HouseList items={items} agreed={agreed} onToggle={toggle} />
            </View>
          </View>

          <View style={[styles.card, styles.pad]}>
            <Text style={styles.cardTitle}>A line from you</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={`Say hello, and what brings you to London.`}
              placeholderTextColor={color.inkFaint}
              style={styles.input}
              multiline
              maxLength={1000}
              accessibilityLabel={`A message to ${host.name}`}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.primary, (problem || state === 'sending') && styles.primaryOff]}
              onPress={send}
              disabled={!!problem || state === 'sending'}
              accessibilityRole="button"
              accessibilityState={{ disabled: !!problem || state === 'sending' }}
            >
              {state === 'sending' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Send request</Text>}
            </Pressable>
            <Text style={styles.why}>{problem ?? 'Asking doesn’t commit you to anything until you both say yes.'}</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.screen },
  scroll: { paddingTop: 40, paddingBottom: 72, paddingHorizontal: 20 },
  col: { maxWidth: 620, width: '100%', alignSelf: 'center', gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: color.hairline, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontSize: 15, color: color.inkSoft },
  title: { flex: 1, fontSize: 24, lineHeight: 31, fontWeight: '700', letterSpacing: -0.5, color: color.ink },
  card: { backgroundColor: color.surface, borderRadius: 20, ...WEB_SHADOW },
  pad: { padding: 20 },
  stayCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  thumb: { width: 64, height: 64, borderRadius: 14, overflow: 'hidden' },
  stayTitle: { fontSize: 16, fontWeight: '700', color: color.ink },
  stayMeta: { fontSize: 13.5, lineHeight: 19, color: color.inkSoft },
  cardTitle: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: color.ink, letterSpacing: -0.2 },
  body: { fontSize: 14.5, lineHeight: 21, color: color.inkSoft, marginTop: 4 },
  input: { marginTop: 10, minHeight: 88, backgroundColor: color.screen, borderWidth: 1, borderColor: color.hairline, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, lineHeight: 22, color: color.ink, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  primary: { backgroundColor: color.brand, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, minWidth: 150, alignItems: 'center' },
  primaryOff: { backgroundColor: color.hairline },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  quiet: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 22, borderWidth: 1, borderColor: color.hairline, backgroundColor: color.surface },
  quietText: { color: color.ink, fontSize: 15, fontWeight: '700' },
  why: { flex: 1, minWidth: 180, fontSize: 13, lineHeight: 19, color: color.inkFaint },
  error: { fontSize: 13.5, color: color.caveat },
  sentCard: { padding: 24, gap: 10 },
  sentEyebrow: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2, color: color.textOnMint },
  sentTitle: { fontSize: 24, lineHeight: 31, fontWeight: '700', letterSpacing: -0.5, color: color.ink },
});
