import { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loop } from '../ui/Loop';
import { color, font, radius, space, shadow } from '../theme/tokens';
import { useSession } from '../api/session';
import { tap } from '../ui/feedback';

/** The demo's front door: one tap in (frictionless), with the real invite + OTP flow one tap away
 *  for anyone who wants to see the security. In demo mode the code is shown on screen (no inbox). */
export function DemoEntry() {
  const { demoLogin, demoAvailable, requestOtp, verifyOtp } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'landing' | 'email' | 'code'>('landing');
  const [email, setEmail] = useState('');
  const [invite, setInvite] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const onDemo = () => {
    tap('medium');
    void run(demoLogin);
  };

  const onSendCode = () =>
    run(async () => {
      const res = await requestOtp(email.trim(), invite.trim() || undefined);
      setDevCode(res.devCode ?? null);
      setMode('code');
    });

  const onVerify = () =>
    run(async () => {
      await verifyOtp(email.trim(), code.trim());
    });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Loop size={54} />
        <Text style={styles.title}>Kiki</Text>
        <Text style={styles.tagline}>Stay in the homes of friends of friends.</Text>

        {mode === 'landing' && (
          <View style={styles.actions}>
            {demoAvailable && (
              <Pressable onPress={onDemo} disabled={busy} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Enter the demo</Text>}
              </Pressable>
            )}
            <Pressable onPress={() => { tap('light'); setMode('email'); }} style={styles.linkBtn}>
              <Text style={styles.linkText}>Sign in with a real invite instead</Text>
            </Pressable>
          </View>
        )}

        {mode === 'email' && (
          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholderTextColor={color.inkFaint} />
            <TextInput style={styles.input} placeholder="Invite code (new members)" autoCapitalize="characters" value={invite} onChangeText={setInvite} placeholderTextColor={color.inkFaint} />
            <Pressable onPress={onSendCode} disabled={busy || !email.trim()} style={({ pressed }) => [styles.primary, (pressed || busy) && styles.pressed, !email.trim() && styles.disabled]}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Send me a code</Text>}
            </Pressable>
            <Pressable onPress={() => setMode('landing')} style={styles.linkBtn}><Text style={styles.linkText}>← Back</Text></Pressable>
          </View>
        )}

        {mode === 'code' && (
          <View style={styles.form}>
            {devCode && (
              <View style={styles.devNote}>
                <Text style={styles.devLabel}>DEMO — your code</Text>
                <Text style={styles.devCode}>{devCode}</Text>
                <Text style={styles.devHint}>In production this is emailed. Shown here so you can try the real flow.</Text>
              </View>
            )}
            <TextInput style={styles.input} placeholder="6-digit code" keyboardType="number-pad" value={code} onChangeText={setCode} placeholderTextColor={color.inkFaint} />
            <Pressable onPress={onVerify} disabled={busy || code.trim().length !== 6} style={({ pressed }) => [styles.primary, (pressed || busy) && styles.pressed, code.trim().length !== 6 && styles.disabled]}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Verify & enter</Text>}
            </Pressable>
            <Pressable onPress={() => setMode('email')} style={styles.linkBtn}><Text style={styles.linkText}>← Back</Text></Pressable>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.screen, gap: 12, maxWidth: 420, width: '100%', alignSelf: 'center' },
  title: { ...font.display, marginTop: 8 },
  tagline: { ...font.body, color: color.inkSoft, textAlign: 'center', marginBottom: 20 },
  actions: { width: '100%', gap: 12, alignItems: 'center' },
  form: { width: '100%', gap: 12 },
  primary: { backgroundColor: color.brand, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center', width: '100%', ...shadow.card },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  linkBtn: { paddingVertical: 10, alignItems: 'center' },
  linkText: { ...font.body, color: color.brand, fontWeight: '700' },
  input: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: 13, ...font.body, color: color.ink },
  devNote: { backgroundColor: '#FFF7E6', borderWidth: 1, borderColor: '#F0D9A8', borderRadius: radius.md, padding: space.md, gap: 4, alignItems: 'center' },
  devLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#9A7B2E' },
  devCode: { fontSize: 28, fontWeight: '800', letterSpacing: 6, color: '#6B5416' },
  devHint: { fontSize: 11, color: '#9A7B2E', textAlign: 'center' },
  error: { ...font.caption, color: '#C15B5B', textAlign: 'center', marginTop: 8 },
});
