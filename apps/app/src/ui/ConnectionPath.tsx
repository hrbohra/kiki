import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { color, radius, space } from '../theme/tokens';
import type { Member } from '../domain/types';

interface Props {
  path: Member[];
  hopNotes: (string | undefined)[];
}

/**
 * The vouch chain inside one card: You → mutual → host, with a 2px connector down the left
 * rail and the vouch note in a tinted bubble on the hop it belongs to. The note is the only
 * sentence in the app written by a real person about a real person, so it gets the one tinted
 * surface in the list.
 */
export function ConnectionPath({ path, hopNotes }: Props) {
  return (
    <View style={styles.card}>
      {path.map((member, i) => {
        const isLast = i === path.length - 1;
        const note = i > 0 ? hopNotes[i - 1] : undefined;
        return (
          <View key={member.id} style={styles.hop}>
            <View style={styles.rail}>
              <Avatar id={member.id} name={member.name} tint={member.avatarColor} country={member.country} size={36} />
              {!isLast ? <View style={styles.connector} /> : null}
            </View>
            <View style={styles.content}>
              <Text style={styles.name}>{i === 0 ? 'You' : member.name}</Text>
              <Text style={styles.role}>{roleFor(i, path.length)}</Text>
              {note ? (
                <View style={styles.noteBubble}>
                  <Text style={styles.noteText}>“{note}”</Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function roleFor(i: number, len: number): string {
  if (i === 0) return 'Where the chain starts';
  if (i === len - 1) return 'The host';
  return 'Mutual friend';
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.hairline, padding: space.card },
  hop: { flexDirection: 'row' },
  rail: { width: 36, alignItems: 'center' },
  connector: { flex: 1, width: 2, backgroundColor: '#CDE6DF', marginVertical: 4, minHeight: 22 },
  content: { flex: 1, marginLeft: space.md, paddingBottom: 22 },
  name: { fontSize: 15, fontWeight: '700', color: color.ink },
  role: { fontSize: 13, fontWeight: '600', color: color.inkFaint, marginTop: 1 },
  noteBubble: { backgroundColor: color.brandTint, borderRadius: radius.md, paddingHorizontal: 13, paddingVertical: 11, marginTop: space.sm },
  noteText: { fontSize: 13, fontWeight: '600', color: color.textOnMint, lineHeight: 18 },
});
