import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { login, register } from '../api';
import type { Session } from '../types';
import { colors } from '../theme';
import { Button, Field } from '../components/ui';

type Props = { onAuthenticated: (session: Session) => Promise<void> };

export function AuthScreen({ onAuthenticated }: Props) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const cleanEmail = email.trim().toLowerCase();
    if (isRegistering && name.trim().length < 2) {
      setError('Escribe tu nombre para crear la cuenta.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Revisa el formato de tu correo electrónico.');
      return;
    }
    if (password.length < (isRegistering ? 6 : 1)) {
      setError(isRegistering ? 'La contraseña debe tener al menos 6 caracteres.' : 'Escribe tu contraseña.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      if (isRegistering) await register(name.trim(), cleanEmail, password);
      const session = await login(cleanEmail, password);
      await onAuthenticated(session);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo completar el inicio de sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topLine}>
          <View style={styles.brandMark}><Text style={styles.brandIcon}>N</Text></View>
          <Text style={styles.brandName}>NOVA <Text style={styles.brandNameLight}>TIENDA</Text></Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>COMPRA LOCAL · VIVE MEJOR</Text></View>
          <Text style={styles.heroTitle}>Lo que buscas,{ '\n' }más cerca.</Text>
          <Text style={styles.heroDescription}>Explora, elige y recibe tus productos favoritos.</Text>
          <View style={styles.heroDecor}>
            <Text style={styles.heroEmoji}>🛍️</Text>
            <View style={styles.heroDot} />
            <View style={styles.heroSmallCircle}><Text style={styles.heroSparkle}>✦</Text></View>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isRegistering ? 'Crea tu cuenta' : 'Hola de nuevo'}</Text>
          <Text style={styles.formSubtitle}>
            {isRegistering ? 'Regístrate para comenzar a comprar.' : 'Inicia sesión para ver la tienda.'}
          </Text>
          <View style={styles.fields}>
            {isRegistering ? (
              <Field label="Nombre completo" value={name} onChangeText={setName} placeholder="Tu nombre" autoCapitalize="words" returnKeyType="next" />
            ) : null}
            <Field label="Correo electrónico" value={email} onChangeText={setEmail} placeholder="nombre@correo.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" />
            <Field label="Contraseña" value={password} onChangeText={setPassword} placeholder={isRegistering ? 'Mínimo 6 caracteres' : 'Tu contraseña'} secureTextEntry returnKeyType="done" onSubmitEditing={submit} />
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

          <Button label={isRegistering ? 'Crear cuenta' : 'Iniciar sesión'} onPress={submit} busy={busy} />
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{isRegistering ? '¿Ya tienes cuenta?' : '¿Primera vez por aquí?'}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => { setIsRegistering(!isRegistering); setError(''); }}
              hitSlop={10}
            >
              <Text style={styles.switchAction}>{isRegistering ? 'Inicia sesión' : 'Regístrate'}</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.footer}>Tu próxima compra empieza aquí.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: Platform.OS === 'android' ? 46 : 58, paddingBottom: 26 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  brandMark: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  brandIcon: { color: colors.surface, fontSize: 18, fontWeight: '900' },
  brandName: { color: colors.ink, fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  brandNameLight: { color: colors.muted, fontWeight: '600' },
  hero: { minHeight: 206, borderRadius: 26, backgroundColor: colors.greenDark, overflow: 'hidden', padding: 23, justifyContent: 'center', marginBottom: 18 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.13)', paddingHorizontal: 10, paddingVertical: 7, marginBottom: 15 },
  heroBadgeText: { color: '#CDE6D7', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  heroTitle: { color: colors.surface, fontSize: 30, lineHeight: 35, letterSpacing: -0.8, fontWeight: '800', maxWidth: '75%' },
  heroDescription: { color: '#D6E3DA', fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: '74%' },
  heroDecor: { position: 'absolute', width: 150, height: 150, right: -19, bottom: -21, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 68, transform: [{ rotate: '-12deg' }] },
  heroDot: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: colors.orange, top: 12, left: 22 },
  heroSmallCircle: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: '#B6D4C1', alignItems: 'center', justifyContent: 'center', right: 27, top: 14 },
  heroSparkle: { color: colors.greenDark, fontSize: 17, fontWeight: '900' },
  formCard: { backgroundColor: colors.surface, borderRadius: 25, padding: 22, borderWidth: 1, borderColor: colors.line },
  formTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  formSubtitle: { color: colors.muted, fontSize: 13, marginTop: 5, marginBottom: 20 },
  fields: { gap: 15, marginBottom: 18 },
  error: { color: colors.red, backgroundColor: colors.redLight, borderRadius: 12, padding: 12, lineHeight: 19, fontSize: 13, marginBottom: 14 },
  switchRow: { flexDirection: 'row', gap: 5, justifyContent: 'center', alignItems: 'center', marginTop: 17 },
  switchText: { color: colors.muted, fontSize: 13 },
  switchAction: { color: colors.green, fontSize: 13, fontWeight: '800' },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 11, marginTop: 20 },
});
