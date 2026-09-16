import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { ReachPill, WEB_SHADOW } from './webBits';
import { GraphModal } from './GraphModal';
import { useSession } from '../../api/session';
import { haptic } from '../../ui/feedback';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';

interface ThreadRow {
  id: string;
  other: { id: string; name: string; avatarColor: string; country: string };
  lastMessage: { text: string; senderId: string } | null;
  unread: number;
}
interface ChatMessage { id: string; senderId: string; text: string }

/**
 * Messages, desktop — inbox + thread side by side, with trust context in both and a thread
 * opener that states from the graph why the conversation exists. Live: the inbox comes from the
 * API, the selected thread opens/loads its history, new messages arrive over the WebSocket, and
 * the composer really sends. The phone's MessagesScreen + ThreadScreen do the same in two steps.
 */
export function MessagesWeb() {
  const { api } = useSession();
  const [rows, setRows] = useState<ThreadRow[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const loadInbox = () =>
    api.messaging.threads.query().then((t) => {
      const list = t as ThreadRow[];
      setRows(list);
      setSel((s) => s ?? list[0]?.other.id ?? null);
    }).catch(() => setRows([]));

  useEffect(() => { void loadInbox(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [api]);

  const append = (m: ChatMessage) => setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));

  useEffect(() => {
    if (!sel) return;
    let alive = true;
    let unsub: (() => void) | undefined;
    setMessages([]);
    setThreadId(null);
    (async () => {
      const thread = await api.messaging.open.mutate({ withId: sel });
      if (!alive) return;
      setThreadId(thread.id);
      const hist = await api.messaging.history.query({ threadId: thread.id });
      if (!alive) return;
      setMessages(hist.map((m) => ({ id: m.id, senderId: m.senderId, text: m.text })));
      void api.messaging.markRead.mutate({ threadId: thread.id }).then(loadInbox).catch(() => {});
      const sub = api.messaging.onMessage.subscribe(undefined, {
        onData: (m) => {
          if (m.threadId === thread.id) append({ id: m.id, senderId: m.senderId, text: m.text });
          void loadInbox();
        },
      });
      unsub = () => sub.unsubscribe();
    })().catch(() => {});
    return () => { alive = false; unsub?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, sel]);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages.length]);

  const onSend = async () => {
    const body = text.trim();
    if (!body || !threadId || sending) return;
    setSending(true);
    setText('');
    haptic.tap();
    try { await api.messaging.send.mutate({ threadId, text: body }); } // arrives back via the subscription
    catch { setText(body); }
    finally { setSending(false); }
  };

  const member = sel ? world.memberById(sel) : null;
  const story = sel ? world.storyFor(sel) : null;
  const opener = member && story
    ? story.reachable && story.path[1]
      ? `${story.path[1].name} vouched for ${member.name}. That is why this thread exists.`
      : `You and ${member.name} connected on Kiki.`
    : '';

  return (
    <View style={{ gap: 20 }}>
      <Text style={styles.h1}>Messages</Text>
      <View style={styles.row}>
        {/* inbox */}
        <View style={styles.inbox}>
          {rows === null ? (
            <View style={styles.loading}><ActivityIndicator color={color.brand} /></View>
          ) : rows.length === 0 ? (
            <Text style={styles.empty}>No conversations yet.</Text>
          ) : rows.map((t) => {
            const m = t.other;
            const active = m.id === sel;
            return (
              <Pressable key={t.id} onPress={() => { haptic.select(); setSel(m.id); }} style={[styles.inboxRow, active ? styles.rowActive : styles.rowIdle]}>
                {active ? <View style={styles.tealStrip} /> : null}
                <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={m.country} size={44} />
                <View style={styles.inboxMeta}>
                  <View style={styles.inboxLine}>
                    <Text style={styles.inboxName}>{m.name}</Text>
                    <ReachPill deg={world.degreeToHost(m.id)} />
                    {t.unread > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{t.unread}</Text></View> : null}
                  </View>
                  <Text style={styles.route} numberOfLines={1}>{story2(m.id)}</Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {t.lastMessage ? `${t.lastMessage.senderId === world.viewerId ? 'You: ' : ''}${t.lastMessage.text}` : 'Say hello'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* thread */}
        <View style={[styles.thread, WEB_SHADOW]}>
          {member ? (
            <>
              <View style={styles.threadHead}>
                <Avatar id={member.id} name={member.name} tint={member.avatarColor} country={member.country} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.threadName}>{member.name}</Text>
                  <Text style={styles.threadSub}>{story2(member.id)}</Text>
                </View>
                <Pressable style={styles.trustLink} onPress={() => setGraphOpen(true)}>
                  <Text style={styles.trustLinkText}>How you're connected ›</Text>
                </Pressable>
              </View>
              <ScrollView ref={scrollRef} contentContainerStyle={styles.msgs} showsVerticalScrollIndicator={false}>
                <Text style={styles.opener}>{opener}</Text>
                {messages.map((msg) => {
                  const mine = msg.senderId === world.viewerId;
                  return (
                    <View key={msg.id} style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                        <Text style={[styles.msgText, mine && styles.msgMine]}>{msg.text}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.inputBar}>
                <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={setText}
                  placeholder={`Message ${member.name}…`}
                  placeholderTextColor={color.inkFaint}
                  onSubmitEditing={onSend}
                  returnKeyType="send"
                  editable={!!threadId}
                />
                <Pressable onPress={onSend} disabled={!text.trim() || sending || !threadId} style={[styles.send, (!text.trim() || sending || !threadId) && styles.sendDisabled]} accessibilityRole="button" accessibilityLabel="Send">
                  <Text style={styles.sendArrow}>↑</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.loading}>{rows === null ? <ActivityIndicator color={color.brand} /> : <Text style={styles.empty}>Pick a conversation.</Text>}</View>
          )}
        </View>
      </View>
      {graphOpen && sel ? <GraphModal hostId={sel} onClose={() => setGraphOpen(false)} /> : null}
    </View>
  );
}

function story2(memberId: string): string {
  const t = world.trustStoryFor(memberId);
  if (!t.reachable) return 'New connection';
  if (t.direct) return 'Direct friend';
  const names = t.channels.map((c) => c.voucher.name);
  return names.length ? `Through ${names.join(' and ')}` : 'Two steps away';
}

const styles = StyleSheet.create({
  h1: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, color: color.ink },
  row: { flexDirection: 'row', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' },
  inbox: { width: 392, flexGrow: 1, flexShrink: 1, maxWidth: 392, minWidth: 0, gap: 10 },
  inboxRow: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, overflow: 'hidden' },
  rowActive: { backgroundColor: color.surface, ...WEB_SHADOW },
  rowIdle: { backgroundColor: 'rgba(255,255,255,0.6)' },
  tealStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.brand },
  inboxMeta: { flex: 1, gap: 3 },
  inboxLine: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  inboxName: { fontSize: 15.5, fontWeight: '700', color: color.ink },
  unread: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  unreadText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  route: { fontSize: 12.5, fontWeight: '600', color: color.textOnMintSoft },
  preview: { fontSize: 13.5, color: color.inkSoft },
  loading: { padding: 40, alignItems: 'center', justifyContent: 'center', flex: 1 },
  empty: { fontSize: 14.5, color: color.inkSoft },
  thread: { flex: 1, flexShrink: 1, minWidth: 0, backgroundColor: color.surface, borderRadius: 20, overflow: 'hidden', height: 620 },
  threadHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: color.hairline },
  threadName: { fontSize: 16, fontWeight: '700', color: color.ink },
  threadSub: { fontSize: 13, fontWeight: '600', color: color.textOnMintSoft },
  trustLink: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: color.brand },
  trustLinkText: { fontSize: 13, fontWeight: '700', color: color.textOnMint },
  msgs: { padding: 20, gap: 10 },
  opener: { alignSelf: 'center', fontSize: 13, color: color.inkFaint, textAlign: 'center', marginBottom: 8, maxWidth: 420 },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '74%', paddingHorizontal: 14, paddingVertical: 11 },
  mine: { backgroundColor: color.brand, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: color.screen, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 6, borderBottomRightRadius: 18 },
  msgText: { fontSize: 14.5, lineHeight: 21, color: color.ink },
  msgMine: { color: '#FFFFFF' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: color.hairline },
  input: { flex: 1, backgroundColor: color.bg, borderRadius: radius.pill, borderWidth: 1, borderColor: color.hairline, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: color.ink },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.45 },
  sendArrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
});
