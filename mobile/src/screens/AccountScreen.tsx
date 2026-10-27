import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Customer, User } from '../types';
import { colors } from '../theme';
import { Button, Field, PageHeading } from '../components/ui';

type Props = {
  user: User;
  customer: Customer | null;
  phone: string;
  onSavePhone: (phone: string) => Promise<void>;
  onSignOut: () => void;
};

export function AccountScreen({ user, customer, phone, onSavePhone, onSignOut }: Props) {
  const [phoneDraft, setPhoneDraft] = useState(phone);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { setPhoneDraft(phone); }, [phone]);

  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await onSavePhone(phoneDraft.trim());
      setMessage('Teléfono actualizado.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el teléfono.');
    } finally {
      setBusy(false);
    }
  }

  const initials = user.nombre.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toLocaleUpperCase();

  return (
    <View style={styles.root}>
      <PageHeading eyebrow="Tu espacio" title="Mi cuenta" detail="Administra tu perfil y preferencias." />
      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}><Text style={styles.initials}>{initials || 'N'}</Text></View>
          <View style={styles.userCopy}>
            <Text style={styles.userName}>{user.nombre}</Text>
            <Text style={styles.userEmail}>{user.correo}</Text>
          </View>
        </View>
        <View style={styles.role}><Text style={styles.roleDot}>●</Text><Text style={styles.roleText}>{user.rol === 'Admin' ? 'Cuenta administradora' : 'Cuenta cliente'}</Text></View>
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Contacto</Text><Text style={styles.sectionHint}>Para coordinar tus pedidos</Text></View>
      <View style={styles.contactCard}>
        <View style={styles.emailRow}><Text style={styles.contactIcon}>✉</Text><View style={styles.contactCopy}><Text style={styles.contactLabel}>Correo</Text><Text style={styles.contactValue}>{customer?.correo ?? user.correo}</Text></View></View>
        <View style={styles.divider} />
        <Field
          label="Teléfono"
          value={phoneDraft}
          onChangeText={setPhoneDraft}
          placeholder="Añade un teléfono (opcional)"
          keyboardType="phone-pad"
          maxLength={20}
        />
        {customer ? <Text style={styles.savedNote}>Este contacto está asociado a tu perfil de cliente.</Text> : <Text style={styles.savedNote}>Se guardará al crear tu primer pedido.</Text>}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        <Button label="Guardar teléfono" variant="secondary" onPress={save} busy={busy} />
      </View>

      <View style={styles.signOut}><Button label="Cerrar sesión" variant="quiet" icon="↪" onPress={onSignOut} /></View>
      <Text style={styles.version}>NOVA TIENDA · APP MÓVIL 1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 },
  profileCard: { backgroundColor: colors.greenDark, borderRadius: 22, padding: 17, marginTop: 18, overflow: 'hidden' },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 53, height: 53, borderRadius: 18, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.greenDark, fontSize: 17, fontWeight: '900' },
  userCopy: { flex: 1 },
  userName: { color: colors.surface, fontSize: 16, fontWeight: '800' },
  userEmail: { color: '#D4E4DB', fontSize: 11, marginTop: 4 },
  role: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 15, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 6, paddingHorizontal: 9 },
  roleDot: { color: '#9BD4AE', fontSize: 8 },
  roleText: { color: '#E3EFE8', fontSize: 9, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  sectionHint: { color: colors.muted, fontSize: 10 },
  contactCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 15, gap: 14 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  contactIcon: { color: colors.green, backgroundColor: colors.greenLight, overflow: 'hidden', width: 34, height: 34, borderRadius: 11, textAlign: 'center', textAlignVertical: 'center', fontSize: 16 },
  contactCopy: { flex: 1 },
  contactLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  contactValue: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.line },
  savedNote: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: -6 },
  error: { color: colors.red, fontSize: 11, lineHeight: 16 },
  success: { color: colors.green, fontSize: 11, fontWeight: '700' },
  signOut: { marginTop: 'auto' },
  version: { textAlign: 'center', color: '#A3ACA7', fontSize: 8, letterSpacing: 1.1, fontWeight: '700', marginTop: 13 },
});
