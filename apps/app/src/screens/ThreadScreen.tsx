import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { TierBadge } from '../ui/TierBadge';
import { TRAIT_GLYPH, Compose } from '../ui/glyphs';
import { color, font, radius, space, shadow } from '../theme/tokens';
import * as world from '../world';
import { useSession } from '../api/session';
import { tap } from '../ui/feedback';
import type { StackProps } from '../navigation';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
}

/** A live chat thread with a trust-context header. Persists + delivers in real time over WebSocket. */
export function ThreadScreen({ route, navigation }: StackProps<'Thread'>) {
  const { api } = useSession();
  const member = world.memberById(route.params.memberId);
  const story = world.storyFor(member.id);
  const standing = world.standingOf(member.id);
  const context = story.reachable
    ? `${story.degrees === 1 ? 'Direct friend' : `${story.degrees}${story.degrees === 2 ? 'nd' : 'th'} degree`}${story.path[1] ? ` · via ${story.path[1].name}` : ''}`
    : 'New connection';

  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  // A Kiki-drafted message (cold-state card). It lands in the composer as text the member owns:
  // they can edit it, clear it, or send it. The AI never sends.
  const draftAsk = route.params.draft;
  const [drafting, setDrafting] = useState(false);
  const [drafted, setDrafted] = useState<null | 'live' | 'cached' | 'baked' | 'composed'>(null);
  const scrollRef = useRef<ScrollView>(null);

  const append = (m: ChatMessage) =>
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));

  useEffect(() => {
    let alive = true;
    let unsub: (() => void) | undefined;
    (async () => {
      const thread = await api.messaging.open.mutate({ withId: member.id });
      if (!alive) return;
      setThreadId(thread.id);
      const hist = await api.messaging.history.query({ threadId: thread.id });
      if (!alive) return;
      setMessages(hist.map((m) => ({ id: m.id, senderId: m.senderId, text: m.text })));
      void api.messaging.markRead.mutate({ threadId: thread.id }).catch(() => {});
      const sub = api.messaging.onMessage.subscribe(undefined, {
        onData: (m) => {
          if (m.threadId === thread.id) append({ id: m.id, senderId: m.senderId, text: m.text });
        },
      });
      unsub = () => sub.unsubscribe();
    })();
    return () => {
      alive = false;
      unsub?.();
    };
  }, [api, member.id]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  useEffect(() => {
    if (!draftAsk || !threadId) return;
    let alive = true;
    setDrafting(true);
    api.ai.draft.query({ kind: draftAsk.kind, memberId: member.id, as: draftAsk.as, nights: draftAsk.nights })
      .then((r) => { if (alive) { setText(r.text); setDrafted(r.source); } })
      .catch(() => {})
      .finally(() => { if (alive) setDrafting(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const onSend = async () => {
    const body = text.trim();
    if (!body || !threadId || sending) return;
    setSending(true);
    setText('');
    setDrafted(null);
    tap('light');
    try {
      await api.messaging.send.mutate({ threadId, text: body });
      // the message arrives back via the subscription and appends (deduped)
    } catch {
      setText(body); // restore on failure
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, shadow.card]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Avatar id={member.id} name={member.name} tint={member.avatarColor} country={member.country} size={38} />
        <View style={styles.headMeta}>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.context}>{context}</Text>
        </View>
        <TierBadge standing={standing} />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {story.overlaps[0] ? (
          <View style={styles.contextCard}>
            {(() => { const G = TRAIT_GLYPH[story.overlaps[0].kind]; return <G size={16} color={color.textOnMint} accent={color.brand} surface={color.brandTint} />; })()}
            <Text style={styles.contextText}>{story.overlaps[0].label}</Text>
          </View>
        ) : null}

        {messages.length > 0 ? (
          messages.map((msg) => {
            const mine = msg.senderId === world.viewerId;
            return (
              <View key={msg.id} style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.mine : [styles.theirs, shadow.card]]}>
                  <Text style={[styles.msgText, mine && styles.msgTextMine]}>{msg.text}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.empty}>Say hello to {member.name}.</Text>
        )}
      </ScrollView>

      {drafting || drafted ? (
        <View style={styles.draftBar} accessibilityLiveRegion="polite">
          <Compose size={16} color={color.textOnMint} accent={color.brand} />
          <Text style={styles.draftNote}>
            {drafting
              ? 'Kiki is drafting this from what the graph can prove…'
              : drafted === 'composed'
                ? 'Drafted from the facts on file (no model was used). Edit it; nothing sends until you do.'
                : `Drafted by Kiki’s AI${drafted === 'cached' ? ' (a saved run)' : ''} from what the graph can prove. Edit it; nothing sends until you do.`}
          </Text>
          {drafted ? <Pressable hitSlop={8} onPress={() => { setText(''); setDrafted(null); }} accessibilityRole="button"><Text style={styles.draftClear}>Clear</Text></Pressable> : null}
        </View>
      ) : null}
      <View style={styles.inputBar}>
        <TextInput
          style={[styles.input, drafted ? styles.inputDraft : null]}
          multiline={!!drafted}
          value={text}
          onChangeText={setText}
          placeholder={`Message ${member.name}…`}
          placeholderTextColor={color.inkFaint}
          onSubmitEditing={onSend}
          returnKeyType="send"
          editable={!!threadId}
        />
        <Pressable onPress={onSend} disabled={!text.trim() || sending} style={[styles.send, (!text.trim() || sending) && styles.sendDisabled]}>
          <Text style={styles.sendArrow}>↑</Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: color.surface, borderBottomWidth: 1, borderBottomColor: color.hairline, zIndex: 2 },
  back: { fontSize: 28, color: color.brand, fontWeight: '700' },
  headMeta: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: color.ink },
  context: { fontSize: 13, fontWeight: '600', color: color.textOnMint },
  body: { padding: space.lg, gap: space.sm },
  contextCard: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.brandTint, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm, alignSelf: 'center', marginBottom: space.sm },
  contextText: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 11 },
  mine: { backgroundColor: color.brand, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: color.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 6, borderBottomRightRadius: 18, borderWidth: 1, borderColor: color.hairline },
  msgText: { fontSize: 15, fontWeight: '500', color: color.ink, lineHeight: 22 },
  msgTextMine: { color: '#FFFFFF' },
  empty: { ...font.body, textAlign: 'center', marginTop: space.xl },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderTopWidth: 1, borderTopColor: color.hairline, backgroundColor: color.surface },
  input: { flex: 1, backgroundColor: color.bg, borderRadius: radius.pill, borderWidth: 1, borderColor: color.hairline, paddingHorizontal: space.lg, paddingVertical: 13, ...font.body, color: color.ink },
  draftBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: space.md, paddingVertical: 9, backgroundColor: color.brandTint, borderTopWidth: 1, borderTopColor: color.hairline },
  draftNote: { flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: '600', color: color.textOnMint },
  draftClear: { fontSize: 12.5, fontWeight: '700', color: color.textOnMint, textDecorationLine: 'underline' },
  inputDraft: { borderRadius: 18, maxHeight: 180, paddingTop: 12 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
  sendArrow: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: -2 },
});
