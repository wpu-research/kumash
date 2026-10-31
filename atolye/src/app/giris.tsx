import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Body, Button, Display, ErrorNote, Label } from '@/components/ui';
import { useSession } from '@/lib/session';
import { DISPLAY, useColors } from '@/lib/theme';

export default function Login() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = async () => {
    if (!email.trim()) return setError('E-postanı gir.');
    if (!password) return setError('Şifreni gir.');
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const input = [styles.input, { color: c.ink, backgroundColor: c.card, borderColor: c.line }];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.paper }}>
      <View style={[styles.wrap, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
        <View style={{ gap: 6 }}>
          <Label>Kumash · personel</Label>
          <Text style={[styles.brand, { color: c.ink }]}>Atölye</Text>
          <Body muted>Ürünü çek, mankene giydir, her yerde yayınla.</Body>
        </View>

        <View style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <Label>E-posta</Label>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              autoFocus
              placeholder="ad@kumash.com"
              placeholderTextColor={c.ink2}
              onSubmitEditing={() => passwordRef.current?.focus()}
              returnKeyType="next"
              style={input}
            />
          </View>
          <View style={{ gap: 6 }}>
            <Label>Şifre</Label>
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              placeholder="••••••••"
              placeholderTextColor={c.ink2}
              onSubmitEditing={submit}
              returnKeyType="go"
              style={input}
            />
          </View>
          {error ? <ErrorNote text={error} /> : null}
          <Button title="Giriş yap" onPress={submit} busy={busy} />
        </View>

        <Display size={16} style={{ color: c.ink2, textAlign: 'center' }}>
          site · trendyol · instagram · facebook
        </Display>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', gap: 32, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brand: { fontFamily: DISPLAY, fontSize: 84, lineHeight: 88 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
});
