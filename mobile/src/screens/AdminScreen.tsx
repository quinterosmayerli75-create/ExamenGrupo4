import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../theme';
import { deleteCategory, deleteProduct, getCategories, getCustomers, getOrders, getProducts, saveCategory, saveProduct, updateOrderStatus } from '../api';
import type { Category, Customer, Order, Product, Session } from '../types';
import { Button, Field, PageHeading } from '../components/ui';

type Section = 'resumen' | 'inventario' | 'categorias' | 'pedidos' | 'clientes';
const sections: { id: Section; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'clientes', label: 'Clientes' },
];
const orderStates = ['Pendiente', 'Pagado', 'Enviado', 'Entregado'];
const money = (amount: number) => `Bs ${amount.toFixed(2)}`;
const dateLabel = (value: string) => new Date(value).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

type Props = { session: Session; onSignOut: () => void };

export function AdminScreen({ session, onSignOut }: Props) {
  const [section, setSection] = useState<Section>('resumen');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [productId, setProductId] = useState<number | null>(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productCategoryId, setProductCategoryId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [query, setQuery] = useState('');

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const [nextProducts, nextCategories, nextOrders, nextCustomers] = await Promise.all([
        getProducts(session.token), getCategories(session.token), getOrders(session.token), getCustomers(session.token),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setOrders(nextOrders.sort((a, b) => b.id - a.id));
      setCustomers(nextCustomers.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el panel administrativo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.token]);

  useEffect(() => { void refresh(); }, [refresh]);

  const lowStock = useMemo(() => products.filter((product) => product.stock <= 5), [products]);
  const pendingOrders = useMemo(() => orders.filter((order) => order.estado === 'Pendiente').length, [orders]);
  const filteredProducts = useMemo(() => products.filter((product) =>
    `${product.nombre} ${product.categoriaNombre ?? ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [products, query]);
  const filteredCustomers = useMemo(() => customers.filter((customer) =>
    `${customer.nombre} ${customer.correo}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [customers, query]);

  function resetProductForm() {
    setProductId(null);
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductStock('');
    setProductCategoryId(categories[0]?.id ?? null);
  }

  function editProduct(product: Product) {
    setProductId(product.id);
    setProductName(product.nombre);
    setProductDescription(product.descripcion ?? '');
    setProductPrice(String(product.precio));
    setProductStock(String(product.stock));
    setProductCategoryId(product.categoriaId);
    setSection('inventario');
  }

  async function submitProduct() {
    const price = Number(productPrice.replace(',', '.'));
    const stock = Number(productStock);
    if (productName.trim().length < 2 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 || !productCategoryId) {
      Alert.alert('Revisa el producto', 'Completa el nombre, un precio mayor a cero, el stock y la categoría.');
      return;
    }
    setBusy(true);
    try {
      await saveProduct(session.token, {
        nombre: productName.trim(), descripcion: productDescription.trim(), precio: price, stock, categoriaId: productCategoryId,
      }, productId ?? undefined);
      resetProductForm();
      await refresh(true);
      Alert.alert('Listo', productId ? 'El producto quedó actualizado.' : 'El producto quedó creado.');
    } catch (requestError) {
      Alert.alert('No se pudo guardar', requestError instanceof Error ? requestError.message : 'Intenta otra vez.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteProduct(product: Product) {
    Alert.alert('Eliminar producto', `¿Quieres eliminar “${product.nombre}”? Si tiene pedidos asociados, la API lo conservará.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { void (async () => {
        setBusy(true);
        try { await deleteProduct(session.token, product.id); await refresh(true); }
        catch (requestError) { Alert.alert('No se pudo eliminar', requestError instanceof Error ? requestError.message : 'Intenta otra vez.'); }
        finally { setBusy(false); }
      })(); } },
    ]);
  }

  function editCategory(category: Category) {
    setCategoryId(category.id);
    setCategoryName(category.nombre);
    setCategoryDescription(category.descripcion ?? '');
    setSection('categorias');
  }

  async function submitCategory() {
    if (categoryName.trim().length < 2) { Alert.alert('Falta el nombre', 'Escribe un nombre para la categoría.'); return; }
    setBusy(true);
    try {
      await saveCategory(session.token, { nombre: categoryName.trim(), descripcion: categoryDescription.trim() }, categoryId ?? undefined);
      setCategoryId(null); setCategoryName(''); setCategoryDescription('');
      await refresh(true);
      Alert.alert('Listo', categoryId ? 'La categoría quedó actualizada.' : 'La categoría quedó creada.');
    } catch (requestError) {
      Alert.alert('No se pudo guardar', requestError instanceof Error ? requestError.message : 'Intenta otra vez.');
    } finally { setBusy(false); }
  }

  function confirmDeleteCategory(category: Category) {
    Alert.alert('Eliminar categoría', `¿Quieres eliminar “${category.nombre}”? No se podrá si todavía tiene productos.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { void (async () => {
        setBusy(true);
        try { await deleteCategory(session.token, category.id); await refresh(true); }
        catch (requestError) { Alert.alert('No se pudo eliminar', requestError instanceof Error ? requestError.message : 'Intenta otra vez.'); }
        finally { setBusy(false); }
      })(); } },
    ]);
  }

  function changeOrderStatus(order: Order, estado: string) {
    if (estado === order.estado) return;
    Alert.alert('Actualizar pedido', `Cambiar el pedido #${String(order.id).padStart(4, '0')} a “${estado}”?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => { void (async () => {
        setBusy(true);
        try { await updateOrderStatus(session.token, order.id, estado); await refresh(true); }
        catch (requestError) { Alert.alert('No se pudo actualizar', requestError instanceof Error ? requestError.message : 'Intenta otra vez.'); }
        finally { setBusy(false); }
      })(); } },
    ]);
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void refresh(true); }} tintColor={colors.green} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topline}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>N</Text></View>
          <View style={styles.brandCopy}><Text style={styles.brand}>NOVA <Text style={styles.brandLight}>TIENDA</Text></Text><Text style={styles.adminBadge}>ADMINISTRACIÓN</Text></View>
          <Pressable accessibilityRole="button" onPress={onSignOut} style={styles.signOut}><Text style={styles.signOutText}>Salir</Text></Pressable>
        </View>

        <PageHeading eyebrow="Panel de control" title={`Hola, ${session.user.nombre.split(' ')[0]}`} detail="Gestiona la tienda y revisa la operación diaria." />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nav}>
          {sections.map((item) => <Pressable key={item.id} onPress={() => { setSection(item.id); setQuery(''); }} style={[styles.navItem, section === item.id && styles.navItemActive]}>
            <Text style={[styles.navText, section === item.id && styles.navTextActive]}>{item.label}</Text>
          </Pressable>)}
        </ScrollView>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><Button label="Reintentar" onPress={() => { void refresh(); }} compact variant="secondary" /></View> : null}
        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={styles.muted}>Cargando datos de la tienda…</Text></View> : null}

        {!loading && section === 'resumen' ? <>
          <View style={styles.metricGrid}>
            <Metric label="Productos" value={String(products.length)} detail="En el catálogo" icon="▦" />
            <Metric label="Pedidos por atender" value={String(pendingOrders)} detail="Estado pendiente" icon="◷" accent={pendingOrders > 0} />
            <Metric label="Clientes" value={String(customers.length)} detail="Perfiles registrados" icon="◉" />
            <Metric label="Stock bajo" value={String(lowStock.length)} detail="Cinco unidades o menos" icon="!" accent={lowStock.length > 0} />
          </View>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Atención prioritaria</Text>
            {lowStock.length ? lowStock.slice(0, 4).map((product) => <View key={product.id} style={styles.alertRow}>
              <View style={styles.alertDot} /><View style={styles.flex}><Text style={styles.rowTitle}>{product.nombre}</Text><Text style={styles.rowDetail}>{product.categoriaNombre ?? 'Sin categoría'}</Text></View><Text style={styles.stockWarning}>{product.stock} uds.</Text>
            </View>) : <Text style={styles.bodyText}>El inventario está en niveles normales.</Text>}
            {pendingOrders > 0 ? <Pressable style={styles.inlineLink} onPress={() => setSection('pedidos')}><Text style={styles.inlineLinkText}>Revisar {pendingOrders} pedido{pendingOrders === 1 ? '' : 's'} pendiente{pendingOrders === 1 ? '' : 's'}  →</Text></Pressable> : null}
          </View>
          <View style={styles.panel}>
            <View style={styles.panelHeader}><Text style={styles.panelTitle}>Pedidos recientes</Text><Pressable onPress={() => setSection('pedidos')}><Text style={styles.inlineLinkText}>Ver todos →</Text></Pressable></View>
            {orders.slice(0, 3).map((order) => <OrderSummary key={order.id} order={order} />)}
            {!orders.length ? <Text style={styles.bodyText}>Todavía no hay pedidos registrados.</Text> : null}
          </View>
        </> : null}

        {!loading && section === 'inventario' ? <>
          <View style={styles.sectionHeading}><View style={styles.flex}><Text style={styles.sectionTitle}>Inventario</Text><Text style={styles.muted}>{products.length} productos en catálogo</Text></View><Button label="Nuevo" icon="＋" compact onPress={() => { resetProductForm(); }} /></View>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{productId ? 'Editar producto' : 'Nuevo producto'}</Text>
            <Field label="Nombre" value={productName} onChangeText={setProductName} placeholder="Ej. Audífonos inalámbricos" maxLength={150} />
            <Field label="Descripción" value={productDescription} onChangeText={setProductDescription} placeholder="Características principales" maxLength={500} multiline style={styles.multiline} />
            <View style={styles.twoFields}><View style={styles.flex}><Field label="Precio (Bs)" value={productPrice} onChangeText={setProductPrice} placeholder="0.00" keyboardType="decimal-pad" /></View><View style={styles.flex}><Field label="Stock" value={productStock} onChangeText={setProductStock} placeholder="0" keyboardType="number-pad" /></View></View>
            <Text style={styles.fieldLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categories.map((category) => <Chip key={category.id} label={category.nombre} selected={productCategoryId === category.id} onPress={() => setProductCategoryId(category.id)} />)}
            </ScrollView>
            <View style={styles.formActions}><Button label={productId ? 'Guardar cambios' : 'Crear producto'} onPress={() => { void submitProduct(); }} busy={busy} /><Button label="Limpiar" onPress={resetProductForm} variant="quiet" compact /></View>
          </View>
          <Field label="Buscar producto" value={query} onChangeText={setQuery} placeholder="Nombre o categoría" />
          {filteredProducts.map((product) => <View key={product.id} style={styles.listCard}>
            <View style={styles.productIcon}><Text style={styles.productIconText}>▦</Text></View><View style={styles.flex}><Text style={styles.rowTitle}>{product.nombre}</Text><Text style={styles.rowDetail}>{product.categoriaNombre ?? 'Sin categoría'} · {money(product.precio)}</Text><Text style={[styles.stockLine, product.stock <= 5 && styles.stockWarning]}>Stock: {product.stock}</Text></View>
            <View style={styles.actionColumn}><SmallAction label="Editar" onPress={() => editProduct(product)} /><SmallAction label="Eliminar" danger onPress={() => confirmDeleteProduct(product)} /></View>
          </View>)}
          {!filteredProducts.length ? <Empty message="No hay productos que coincidan." /> : null}
        </> : null}

        {!loading && section === 'categorias' ? <>
          <View style={styles.sectionHeading}><View style={styles.flex}><Text style={styles.sectionTitle}>Categorías</Text><Text style={styles.muted}>Organiza cómo se muestra el catálogo.</Text></View></View>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{categoryId ? 'Editar categoría' : 'Nueva categoría'}</Text>
            <Field label="Nombre" value={categoryName} onChangeText={setCategoryName} placeholder="Ej. Accesorios" maxLength={100} />
            <Field label="Descripción" value={categoryDescription} onChangeText={setCategoryDescription} placeholder="Descripción breve" maxLength={250} multiline style={styles.multiline} />
            <View style={styles.formActions}><Button label={categoryId ? 'Guardar cambios' : 'Crear categoría'} onPress={() => { void submitCategory(); }} busy={busy} /><Button label="Limpiar" onPress={() => { setCategoryId(null); setCategoryName(''); setCategoryDescription(''); }} variant="quiet" compact /></View>
          </View>
          {categories.map((category) => <View key={category.id} style={styles.listCard}>
            <View style={styles.categoryIcon}><Text style={styles.productIconText}>◇</Text></View><View style={styles.flex}><Text style={styles.rowTitle}>{category.nombre}</Text><Text style={styles.rowDetail}>{category.descripcion || 'Sin descripción'}</Text><Text style={styles.stockLine}>{products.filter((product) => product.categoriaId === category.id).length} productos</Text></View>
            <View style={styles.actionColumn}><SmallAction label="Editar" onPress={() => editCategory(category)} /><SmallAction label="Eliminar" danger onPress={() => confirmDeleteCategory(category)} /></View>
          </View>)}
        </> : null}

        {!loading && section === 'pedidos' ? <>
          <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Pedidos</Text><Text style={styles.muted}>{orders.length} registros · actualiza su estado</Text></View></View>
          {!orders.length ? <Empty message="Los pedidos nuevos aparecerán aquí." /> : orders.map((order) => <View key={order.id} style={styles.panel}>
            <View style={styles.panelHeader}><View><Text style={styles.rowTitle}>Pedido #{String(order.id).padStart(4, '0')}</Text><Text style={styles.rowDetail}>{dateLabel(order.fecha)} · {order.clienteNombre || `Cliente ${order.clienteId}`}</Text></View><Text style={styles.total}>{money(order.total)}</Text></View>
            {(order.detalles ?? []).map((detail) => <View key={detail.id} style={styles.detailRow}><Text style={styles.bodyText}>{detail.cantidad} × {detail.productoNombre ?? `Producto ${detail.productoId}`}</Text><Text style={styles.bodyText}>{money(detail.subtotal)}</Text></View>)}
            <Text style={styles.fieldLabel}>Estado del pedido</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {orderStates.map((state) => <Chip key={state} label={state} selected={order.estado === state} onPress={() => changeOrderStatus(order, state)} />)}
            </ScrollView>
          </View>)}
        </> : null}

        {!loading && section === 'clientes' ? <>
          <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Clientes</Text><Text style={styles.muted}>{customers.length} perfiles · información de contacto</Text></View></View>
          <Field label="Buscar cliente" value={query} onChangeText={setQuery} placeholder="Nombre o correo" />
          {filteredCustomers.map((customer) => <CustomerCard key={customer.id} customer={customer} orderCount={orders.filter((order) => order.clienteId === customer.id).length} />)}
          {!filteredCustomers.length ? <Empty message="No hay clientes que coincidan." /> : null}
        </> : null}

        <Text style={styles.footer}>NOVA TIENDA · Panel de administración</Text>
      </ScrollView>
    </View>
  );
}

function Metric({ label, value, detail, icon, accent = false }: { label: string; value: string; detail: string; icon: string; accent?: boolean }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, accent && styles.metricIconAlert]}><Text style={[styles.metricIconText, accent && styles.metricIconAlertText]}>{icon}</Text></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricDetail}>{detail}</Text></View>;
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>;
}

function SmallAction({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) {
  return <Pressable onPress={onPress} style={styles.smallAction}><Text style={[styles.smallActionText, danger && styles.dangerText]}>{label}</Text></Pressable>;
}

function OrderSummary({ order }: { order: Order }) {
  return <View style={styles.alertRow}><View style={[styles.statusDot, order.estado === 'Entregado' && styles.statusDotDone]} /><View style={styles.flex}><Text style={styles.rowTitle}>Pedido #{String(order.id).padStart(4, '0')}</Text><Text style={styles.rowDetail}>{order.clienteNombre || `Cliente ${order.clienteId}`} · {dateLabel(order.fecha)}</Text></View><View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{order.estado}</Text></View></View>;
}

function CustomerCard({ customer, orderCount }: { customer: Customer; orderCount: number }) {
  return <View style={styles.listCard}><View style={styles.customerAvatar}><Text style={styles.customerAvatarText}>{customer.nombre.trim().charAt(0).toLocaleUpperCase()}</Text></View><View style={styles.flex}><Text style={styles.rowTitle}>{customer.nombre}</Text><Text style={styles.rowDetail}>{customer.correo}</Text><Text style={styles.rowDetail}>{customer.telefono || 'Sin teléfono registrado'}</Text></View><View style={styles.customerOrders}><Text style={styles.customerOrdersValue}>{orderCount}</Text><Text style={styles.customerOrdersLabel}>pedidos</Text></View></View>;
}

function Empty({ message }: { message: string }) {
  return <View style={styles.empty}><Text style={styles.emptyMark}>✓</Text><Text style={styles.bodyText}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36, gap: 16 },
  topline: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  brandMark: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: colors.surface, fontSize: 22, fontWeight: '900' },
  brandCopy: { flex: 1 },
  brand: { color: colors.ink, fontSize: 13, letterSpacing: 1.5, fontWeight: '900' },
  brandLight: { color: colors.muted, fontWeight: '600' },
  adminBadge: { color: colors.green, fontSize: 9, letterSpacing: 1.3, fontWeight: '900', marginTop: 2 },
  signOut: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 13 },
  signOutText: { color: colors.green, fontSize: 12, fontWeight: '800' },
  nav: { gap: 8, paddingVertical: 3 },
  navItem: { borderRadius: 14, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  navItemActive: { backgroundColor: colors.green, borderColor: colors.green },
  navText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  navTextActive: { color: colors.surface },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { width: '48%', flexGrow: 1, minHeight: 145, backgroundColor: colors.surface, borderRadius: 21, padding: 15, borderColor: colors.line, borderWidth: 1 },
  metricIcon: { width: 31, height: 31, borderRadius: 11, backgroundColor: colors.greenLight, justifyContent: 'center', alignItems: 'center', marginBottom: 9 },
  metricIconAlert: { backgroundColor: colors.orangeLight },
  metricIconText: { color: colors.green, fontSize: 16, fontWeight: '900' },
  metricIconAlertText: { color: colors.red },
  metricValue: { color: colors.ink, fontSize: 26, fontWeight: '900' },
  metricLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 1 },
  metricDetail: { color: colors.muted, fontSize: 10, marginTop: 3 },
  panel: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 22, padding: 16, gap: 12 },
  panelTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8 },
  alertDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange },
  statusDotDone: { backgroundColor: colors.green },
  flex: { flex: 1 },
  rowTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  rowDetail: { color: colors.muted, fontSize: 11, marginTop: 3 },
  stockWarning: { color: colors.red, fontSize: 11, fontWeight: '900' },
  stockLine: { color: colors.muted, fontSize: 11, marginTop: 5, fontWeight: '700' },
  inlineLink: { paddingTop: 8 },
  inlineLinkText: { color: colors.green, fontSize: 12, fontWeight: '800' },
  bodyText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.orangeLight },
  statusBadgeText: { color: colors.greenDark, fontSize: 10, fontWeight: '800' },
  loading: { alignItems: 'center', paddingVertical: 35, gap: 12 },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  errorBox: { backgroundColor: colors.redLight, borderRadius: 16, padding: 14, gap: 10 },
  errorText: { color: colors.red, fontSize: 12, lineHeight: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 3 },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '900', letterSpacing: -0.5 },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 19 },
  productIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  productIconText: { color: colors.green, fontSize: 18, fontWeight: '900' },
  categoryIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  actionColumn: { alignItems: 'flex-end', gap: 8 },
  smallAction: { paddingVertical: 3, paddingHorizontal: 5 },
  smallActionText: { color: colors.green, fontSize: 11, fontWeight: '800' },
  dangerText: { color: colors.red },
  multiline: { minHeight: 84, textAlignVertical: 'top', paddingTop: 13 },
  twoFields: { flexDirection: 'row', gap: 12 },
  fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 2 },
  chips: { flexDirection: 'row', gap: 8, paddingVertical: 3 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.greenLight, borderColor: colors.green },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  chipTextSelected: { color: colors.greenDark },
  formActions: { gap: 9 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 3 },
  total: { color: colors.greenDark, fontSize: 15, fontWeight: '900' },
  customerAvatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  customerAvatarText: { color: colors.green, fontSize: 18, fontWeight: '900' },
  customerOrders: { alignItems: 'center', minWidth: 42 },
  customerOrdersValue: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  customerOrdersLabel: { color: colors.muted, fontSize: 9 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 28, paddingHorizontal: 20, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 20 },
  emptyMark: { width: 35, height: 35, textAlign: 'center', textAlignVertical: 'center', backgroundColor: colors.greenLight, color: colors.green, overflow: 'hidden', borderRadius: 12, fontSize: 17, fontWeight: '900' },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 10, marginTop: 9 },
});
