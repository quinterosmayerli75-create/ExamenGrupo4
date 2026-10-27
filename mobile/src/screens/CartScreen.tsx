import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CartItem, Customer, Product } from '../types';
import { colors } from '../theme';
import { Button, EmptyState, Field, PageHeading } from '../components/ui';
import { categoryEmoji } from './HomeScreen';

type Props = {
  items: CartItem[];
  customer: Customer | null;
  phone: string;
  onPhoneChange: (value: string) => void;
  onQuantityChange: (product: Product, quantity: number) => void;
  onRemove: (productId: number) => void;
  onCheckout: (phone: string) => Promise<boolean>;
};

export function CartScreen({ items, customer, phone, onPhoneChange, onQuantityChange, onRemove, onCheckout }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = items.reduce((sum, item) => sum + Number(item.product.precio) * item.quantity, 0);

  async function checkout() {
    setError('');
    setBusy(true);
    try {
      const succeeded = await onCheckout(phone.trim());
      if (!succeeded) setError('No pudimos confirmar el pedido. Revisa tu conexión e inténtalo otra vez.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el pedido.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PageHeading eyebrow="Tu selección" title="Mi carrito" detail={`${items.length} ${items.length === 1 ? 'artículo' : 'artículos'}`} />

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState icon="🛒" title="Tu carrito está esperando" description="Cuando encuentres algo que te guste, aparecerá aquí." />
        </View>
      ) : (
        <>
          <View style={styles.itemList}>
            {items.map(({ product, quantity }) => (
              <CartRow key={product.id} product={product} quantity={quantity} onChange={onQuantityChange} onRemove={onRemove} />
            ))}
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileTitleRow}>
              <View style={styles.profileIcon}><Text style={styles.profileIconText}>⌖</Text></View>
              <View style={styles.profileTitleCopy}>
                <Text style={styles.profileTitle}>¿A nombre de quién?</Text>
                <Text style={styles.profileSub}>{customer?.nombre ?? 'Crearemos tu perfil al hacer el pedido.'}</Text>
              </View>
            </View>
            <Field
              label="Teléfono de contacto (opcional)"
              value={phone}
              onChangeText={onPhoneChange}
              placeholder="Ej. 700 12345"
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryHeading}>Resumen del pedido</Text>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Productos</Text><Text style={styles.summaryValue}>{items.reduce((sum, item) => sum + item.quantity, 0)} unidades</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Entrega</Text><Text style={styles.delivery}>A coordinar</Text></View>
            <View style={styles.divider} />
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>Bs {total.toFixed(2)}</Text></View>
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Button label="Confirmar pedido" icon="✓" onPress={checkout} busy={busy} />
          <Text style={styles.terms}>El stock se confirma al crear el pedido. El pago se coordina con la tienda.</Text>
        </>
      )}
    </ScrollView>
  );
}

function CartRow({ product, quantity, onChange, onRemove }: {
  product: Product;
  quantity: number;
  onChange: (product: Product, quantity: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <View style={styles.cartRow}>
      <View style={[styles.cartArt, { backgroundColor: product.categoriaId % 2 ? colors.orangeLight : colors.greenLight }]}>
        <Text style={styles.cartEmoji}>{categoryEmoji(product.categoriaNombre)}</Text>
      </View>
      <View style={styles.cartCopy}>
        <Text numberOfLines={1} style={styles.cartName}>{product.nombre}</Text>
        <Text style={styles.cartPrice}>Bs {Number(product.precio).toFixed(2)}</Text>
        <View style={styles.cartActions}>
          <View style={styles.stepper}>
            <Pressable accessibilityRole="button" accessibilityLabel="Restar unidad" onPress={() => onChange(product, quantity - 1)} style={styles.stepButton}><Text style={styles.stepText}>−</Text></Pressable>
            <Text style={styles.quantityText}>{quantity}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Sumar unidad" disabled={quantity >= product.stock} onPress={() => onChange(product, quantity + 1)} style={styles.stepButton}><Text style={styles.stepText}>+</Text></Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => onRemove(product.id)} hitSlop={8}><Text style={styles.remove}>Quitar</Text></Pressable>
        </View>
      </View>
      <Text style={styles.lineTotal}>Bs {(Number(product.precio) * quantity).toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
  emptyWrap: { marginTop: 24 },
  itemList: { gap: 11, marginTop: 19 },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 19, padding: 11 },
  cartArt: { width: 63, height: 72, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cartEmoji: { fontSize: 29 },
  cartCopy: { flex: 1, justifyContent: 'center' },
  cartName: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  cartPrice: { color: colors.greenDark, fontSize: 11, fontWeight: '700', marginTop: 4 },
  cartActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: { width: 25, height: 25, borderRadius: 9, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.greenDark, fontSize: 17, lineHeight: 20, fontWeight: '700' },
  quantityText: { color: colors.ink, fontSize: 12, fontWeight: '800', minWidth: 11, textAlign: 'center' },
  remove: { color: colors.red, fontSize: 10, fontWeight: '700' },
  lineTotal: { alignSelf: 'flex-start', color: colors.ink, fontSize: 10, fontWeight: '800', marginTop: 3 },
  profileCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 15, marginTop: 16, gap: 16 },
  profileTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  profileIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.orangeLight, alignItems: 'center', justifyContent: 'center' },
  profileIconText: { color: colors.greenDark, fontSize: 20, fontWeight: '800' },
  profileTitleCopy: { flex: 1 },
  profileTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  profileSub: { color: colors.muted, fontSize: 11, marginTop: 3 },
  summary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 17, marginTop: 14, marginBottom: 16 },
  summaryHeading: { color: colors.ink, fontSize: 14, fontWeight: '800', marginBottom: 13 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: colors.muted, fontSize: 12 },
  summaryValue: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  delivery: { color: colors.green, fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.line, marginTop: 2, marginBottom: 13 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  totalValue: { color: colors.greenDark, fontSize: 20, fontWeight: '900' },
  error: { color: colors.red, backgroundColor: colors.redLight, borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  terms: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 9 },
});
