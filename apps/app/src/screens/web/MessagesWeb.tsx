import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from '../../ui/Avatar';
import { ReachPill, WEB_SHADOW } from './webBits';
import { GraphModal } from './GraphModal';
import { threads, threadWith, lastDay } from '../../messaging/threads';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';

/** Messages — inbox + thread, with trust context in both, and a thread opener that states
 *  from the graph why the conversation exists. */
export function MessagesWeb() {
  const ordered = [...threads].sort((a, b) => lastDay(b) - lastDay(a));
  const [sel, setSel] = useState(ordered[0].withId);
  const [graphOpen, setGraphOpen] = useState(false);
  const member = world.memberById(sel);
  const thread = threadWith(sel);
  const story = world.storyFor(sel);
  const opener = story.reachable && story.path[1]
    ? `${story.path[1].name} vouched for ${member.name}. That is why this thread exists.`
    : `You and ${member.name} connected on Kiki.`;

  return (
    <View style={{ gap: 20 }}>
      <Text style={styles.h1}>Messages</Text>
      <View style={styles.row}>
        {/* inbox */}
        <View style={styles.inbox}>
          {ordered.map((t) => {
            const m = world.memberById(t.withId);
            const last = t.messages[t.messages.length - 1];
            const active = t.withId === sel;
            return (
              <Pressable key={t.id} onPress={() => setSel(t.withId)} style={[styles.inboxRow, active ? styles.rowActive : styles.rowIdle]}>
                {active ? <View style={styles.tealStrip} /> : null}
                <Avatar id={m.id} name={m.name} tint={m.avatarColor} country={m.country} size={44} />
                <View style={styles.inboxMeta}>
                  <View style={styles.inboxLine}><Text style={styles.inboxName}>{m.name}</Text><ReachPill deg={world.degreeToHost(t.withId)} /></View>
                  <Text style={styles.route} numberOfLines={1}>{story2(t.withId)}</Text>
                  <Text style={styles.preview} numberOfLines={1}>{last.fromId === world.viewerId ? 'You: ' : ''}{last.text}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* thread */}
        <View style={[styles.thread, WEB_SHADOW]}>
          <View style={styles.threadHead}>
            <Avatar id={member.id} name={member.name} tint={member.avatarColor} country={member.country} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.threadName}>{member.name}</Text>
              <Text style={styles.threadSub}>{story2(sel)}</Text>
            </View>
            <Pressable style={styles.trustLink} onPress={() => setGraphOpen(true)}>
              <Text style={styles.trustLinkText}>How you're connected ›</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.msgs} showsVerticalScrollIndicator={false}>
            <Text style={styles.opener}>{opener}</Text>
            {thread?.messages.map((msg) => {
              const mine = msg.fromId === world.viewerId;
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
            <View style={styles.input}><Text style={styles.inputPlaceholder}>Message {member.name}…</Text></View>
            <View style={styles.send}><Text style={styles.sendArrow}>↑</Text></View>
          </View>
        </View>
      </View>
      {graphOpen ? <GraphModal hostId={sel} onClose={() => setGraphOpen(false)} /> : null}
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
  inbox: { width: 392, flexGrow: 1, maxWidth: 392, gap: 10 },
  inboxRow: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, overflow: 'hidden' },
  rowActive: { backgroundColor: color.surface, ...WEB_SHADOW },
  rowIdle: { backgroundColor: 'rgba(255,255,255,0.6)' },
  tealStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color.brand },
  inboxMeta: { flex: 1, gap: 3 },
  inboxLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inboxName: { fontSize: 15.5, fontWeight: '700', color: color.ink },
  route: { fontSize: 12.5, fontWeight: '600', color: color.textOnMintSoft },
  preview: { fontSize: 13.5, color: color.inkSoft },
  thread: { flex: 1, minWidth: 340, backgroundColor: color.surface, borderRadius: 20, overflow: 'hidden', height: 620 },
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
  input: { flex: 1, backgroundColor: color.bg, borderRadius: radius.pill, borderWidth: 1, borderColor: color.hairline, paddingHorizontal: 16, paddingVertical: 12 },
  inputPlaceholder: { fontSize: 14, color: color.inkFaint },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  sendArrow: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
});
