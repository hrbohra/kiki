import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

import { Loop } from '../ui/Loop';
import { verifyCode } from '../demo/gate';
import { color, radius, shadow } from '../theme/tokens';

/** The invite-code wall for the deployed demo. On-brand with Kiki's invite-only DNA: you prove
 *  you were invited before you can look inside. A correct code unlocks the app for this browser. */
export function InviteGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    if (!code.trim() || checking) return;
    setChecking(true);
    setError(false);
    const ok = await verifyCode(code);
    if (ok) { onUnlock(); return; }
    setError(true);
    setChecking(false);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.card, shadow.card]}>
        <View style={styles.wordmark}><Loop size={34} color={color.brand} opacity={1} strokeWidth={9} /><Text style={styles.brand}>Kiki</Text></View>
        <Text style={styles.title}>This demo is invite-only.</Text>
        <Text style={styles.sub}>Like Kiki itself, you get in through the code you were given — it's with the application.</Text>

        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={code}
          onChangeText={(v) => { setCode(v); if (error) setError(false); }}
          onSubmitEditing={submit}
          placeholder="Your invite code"
          placeholderTextColor={color.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
        />
        {error ? <Text style={styles.errorText}>That code doesn't match. Check the application and try again.</Text> : null}

        <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, checking && styles.btnDisabled]} onPress={submit}>
          <Text style={styles.btnText}>{checking ? 'Checking…' : 'Unlock the demo'}</Text>
        </Pressable>

        <Text style={styles.foot}>A working prototype of Kiki's trust model.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.screen, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, backgroundColor: color.surface, borderRadius: 22, padding: 32, gap: 12, alignItems: 'flex-start' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  brand: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2, color: color.ink },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: color.ink },
  sub: { fontSize: 14.5, lineHeight: 21, color: color.inkSoft },
  input: { alignSelf: 'stretch', marginTop: 6, backgroundColor: color.screen, borderWidth: 1, borderColor: color.hairline, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, fontSize: 15, color: color.ink },
  inputError: { borderColor: color.caveat },
  errorText: { fontSize: 13, color: color.caveat },
  btn: { alignSelf: 'stretch', backgroundColor: color.brand, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 2 },
  btnPressed: { backgroundColor: color.brandDark },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  foot: { fontSize: 12, color: color.inkFaint, marginTop: 6 },
});
