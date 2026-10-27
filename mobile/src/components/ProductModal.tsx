import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Product } from '../types';
import { colors } from '../theme';
import { Button } from './ui';
import { categoryEmoji } from '../screens/HomeScreen';

type Props = {
  product: Product | null;
  onClose: () => void;
  onAdd: (product: Product, quantity: number) => void;
};

export function ProductModal({ product, onClose, onAdd }: Props) {
  const [quantity, setQuantity] = useState(1);
  useEffect(() => { setQuantity(1); }, [product?.id]);

  if (!product) return null;
  const available = product.stock > 0;

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar detalle" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.art}>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
              <Text style={styles.artEmoji}>{categoryEmoji(product.categoriaNombre)}</Text>
              <View style={styles.artBadge}><Text style={styles.artBadgeText}>{product.categoriaNombre ?? 'NOVA TIENDA'}</Text></View>
            </View>
            <Text style={styles.eyebrow}>DETALLE DEL PRODUCTO</Text>
            <Text style={styles.name}>{product.nombre}</Text>
            <Text style={styles.description}>{product.descripcion?.trim() || 'Un favorito pensado para acompañarte en tu día a día.'}</Text>
            <View style={styles.priceRow}>
              <View><Text style={styles.price}>Bs {Number(product.precio).toFixed(2)}</Text><Text style={styles.stock}>{available ? `${product.stock} unidades en stock` : 'Sin stock por ahora'}</Text></View>
              <View style={styles.quantity}>
                <Pressable accessibilityRole="button" accessibilityLabel="Restar una unidad" disabled={quantity <= 1} onPress={() => setQuantity((value) => Math.max(1, value - 1))} style={styles.quantityButton}><Text style={styles.quantitySymbol}>−</Text></Pressable>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Sumar una unidad" disabled={quantity >= product.stock} onPress={() => setQuantity((value) => Math.min(product.stock, value + 1))} style={styles.quantityButton}><Text style={styles.quantitySymbol}>+</Text></Pressable>
              </View>
            </View>
            <Button
              label={available ? `Agregar · Bs ${(Number(product.precio) * quantity).toFixed(2)}` : 'Producto agotado'}
              disabled={!available}
              onPress={() => { onAdd(product, quantity); onClose(); }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,33,26,0.42)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, overflow: 'hidden' },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 3, backgroundColor: '#CCD3CE', marginBottom: 10 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  art: { height: 220, borderRadius: 22, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 21 },
  artEmoji: { fontSize: 86 },
  artBadge: { position: 'absolute', left: 14, bottom: 13, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.86)', paddingHorizontal: 10, paddingVertical: 7 },
  artBadgeText: { color: colors.greenDark, fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  close: { position: 'absolute', top: 12, right: 12, zIndex: 2, width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.ink, fontSize: 25, lineHeight: 28 },
  eyebrow: { color: colors.green, fontSize: 9, letterSpacing: 1.2, fontWeight: '900' },
  name: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 7 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 18 },
  price: { color: colors.greenDark, fontSize: 22, fontWeight: '900' },
  stock: { color: colors.muted, fontSize: 11, marginTop: 4 },
  quantity: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.line },
  quantityButton: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  quantitySymbol: { color: colors.greenDark, fontSize: 19, fontWeight: '700', lineHeight: 22 },
  quantityValue: { color: colors.ink, width: 35, textAlign: 'center', fontSize: 14, fontWeight: '800' },
});
