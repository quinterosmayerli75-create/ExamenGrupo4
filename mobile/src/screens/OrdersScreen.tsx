import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Order } from '../types';
import { colors } from '../theme';
import { EmptyState, PageHeading } from '../components/ui';

type Props = { orders: Order[]; loading: boolean; error: string; onRefresh: () => void };

function statusStyle(status?: string | null) {
  switch ((status ?? '').toLowerCase()) {
    case 'entregado': return { backgroundColor: colors.greenLight, color: colors.greenDark };
    case 'enviado': return { backgroundColor: colors.lavender, color: '#5D4B88' };
    case 'pagado': return { backgroundColor: colors.orangeLight, color: '#916024' };
    default: return { backgroundColor: '#EEF0ED', color: colors.muted };
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function OrdersScreen({ orders, loading, error, onRefresh }: Props) {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.green} />}
    >
      <PageHeading eyebrow="Todo en un solo lugar" title="Mis pedidos" detail="Sigue el estado de tus compras." />
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {!loading && !error && orders.length === 0 ? (
        <View style={styles.emptyWrap}><EmptyState icon="📦" title="Aún no tienes pedidos" description="Cuando confirmes tu primera compra, podrás seguirla aquí." /></View>
      ) : (
        <View style={styles.orders}>
          {orders.map((order) => {
            const badge = statusStyle(order.estado);
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View style={styles.orderIcon}><Text style={styles.orderIconText}>↗</Text></View>
                  <View style={styles.orderHeading}>
                    <Text style={styles.orderId}>Pedido #{String(order.id).padStart(4, '0')}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.fecha)}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: badge.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: badge.color }]}>{order.estado ?? 'Pendiente'}</Text>
                  </View>
                </View>
                <View style={styles.separator} />
                <View style={styles.lines}>
                  {(order.detalles ?? []).map((detail) => (
                    <View key={detail.id} style={styles.lineRow}>
                      <Text numberOfLines={1} style={styles.lineName}>{detail.cantidad} × {detail.productoNombre ?? 'Producto'}</Text>
                      <Text style={styles.lineValue}>Bs {Number(detail.subtotal).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.itemCount}>{order.detalles?.length ?? 0} {order.detalles?.length === 1 ? 'artículo' : 'artículos'}</Text>
                  <View style={styles.totalCopy}><Text style={styles.totalCaption}>TOTAL</Text><Text style={styles.total}>Bs {Number(order.total).toFixed(2)}</Text></View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
  emptyWrap: { marginTop: 23 },
  orders: { gap: 13, marginTop: 20 },
  orderCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 21, padding: 15 },
  orderTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  orderIconText: { color: colors.green, fontSize: 21, fontWeight: '800' },
  orderHeading: { flex: 1 },
  orderId: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  orderDate: { color: colors.muted, fontSize: 10, marginTop: 4, textTransform: 'capitalize' },
  statusPill: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { fontSize: 9, fontWeight: '800' },
  separator: { height: 1, backgroundColor: colors.line, marginVertical: 13 },
  lines: { gap: 8 },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  lineName: { color: colors.ink, flex: 1, fontSize: 11 },
  lineValue: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 13, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemCount: { color: colors.muted, fontSize: 10 },
  totalCopy: { alignItems: 'flex-end', gap: 2 },
  totalCaption: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  total: { color: colors.greenDark, fontSize: 17, fontWeight: '900' },
  error: { backgroundColor: colors.redLight, borderRadius: 14, padding: 12, marginTop: 15 },
  errorText: { color: colors.red, fontSize: 12, lineHeight: 18 },
});
