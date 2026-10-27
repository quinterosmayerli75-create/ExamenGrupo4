import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import {
  createCustomer,
  createOrder,
  getCategories,
  getCustomer,
  getCustomers,
  getOrders,
  getProducts,
  updateCustomer,
} from './src/api';
import { BottomTabs, type Tab } from './src/components/BottomTabs';
import { ProductModal } from './src/components/ProductModal';
import { AccountScreen } from './src/screens/AccountScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { CartScreen } from './src/screens/CartScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { colors } from './src/theme';
import type { ApiError, CartItem, Category, Customer, Order, Product, Session, User } from './src/types';

const TOKEN_KEY = 'nova.auth.token';
const USER_KEY = 'nova.auth.user';
const customerKey = (id: number) => `nova.customer.${id}`;
const phoneKey = (id: number) => `nova.phone.${id}`;

async function findCustomer(token: string, user: User): Promise<Customer | null> {
  const savedId = await SecureStore.getItemAsync(customerKey(user.id));
  if (savedId) {
    try {
      return await getCustomer(token, Number(savedId));
    } catch (error) {
      if ((error as ApiError).status !== 404) throw error;
      await SecureStore.deleteItemAsync(customerKey(user.id));
    }
  }

  const customers = await getCustomers(token);
  const match = customers.find((item) => item.correo.trim().toLocaleLowerCase() === user.correo.trim().toLocaleLowerCase()) ?? null;
  if (match) await SecureStore.setItemAsync(customerKey(user.id), String(match.id));
  return match;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [phone, setPhone] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    let alive = true;
    async function restore() {
      try {
        const [token, userJson] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (!alive || !token || !userJson) return;
        const user = JSON.parse(userJson) as User;
        if (!user?.id || !user?.correo) return;
        setSession({ token, user });
        const savedPhone = await SecureStore.getItemAsync(phoneKey(user.id));
        if (alive && savedPhone) setPhone(savedPhone);
      } catch {
        if (alive) {
          await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
          await SecureStore.deleteItemAsync(USER_KEY).catch(() => undefined);
        }
      } finally {
        if (alive) setBooting(false);
      }
    }
    void restore();
    return () => { alive = false; };
  }, []);

  const loadStore = useCallback(async () => {
    if (!session) return;
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        getProducts(session.token),
        getCategories(session.token),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setCart((current) => current
        .filter((item) => nextProducts.some((product) => product.id === item.product.id && product.stock > 0))
        .map((item) => {
          const latest = nextProducts.find((product) => product.id === item.product.id)!;
          return { product: latest, quantity: Math.min(item.quantity, latest.stock) };
        }));
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'No se pudo cargar la tienda.');
      if ((error as ApiError).status === 401) Alert.alert('Sesión vencida', 'Inicia sesión otra vez para seguir usando la tienda.');
    } finally {
      setCatalogLoading(false);
    }

    try {
      const resolvedCustomer = await findCustomer(session.token, session.user);
      setCustomer(resolvedCustomer);
      if (resolvedCustomer) {
        setPhone(resolvedCustomer.telefono ?? '');
      } else {
        const savedPhone = await SecureStore.getItemAsync(phoneKey(session.user.id));
        if (savedPhone) setPhone(savedPhone);
      }
      if (resolvedCustomer) {
        const allOrders = await getOrders(session.token);
        setOrders(allOrders.filter((order) => order.clienteId === resolvedCustomer.id).sort((a, b) => b.id - a.id));
        setOrdersError('');
      } else {
        setOrders([]);
      }
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : 'No se pudo cargar tu perfil y tus pedidos.');
    }
  }, [session]);

  useEffect(() => { void loadStore(); }, [loadStore]);

  const refreshOrders = useCallback(async () => {
    if (!session) return;
    setOrdersLoading(true);
    setOrdersError('');
    try {
      let currentCustomer = customer;
      if (!currentCustomer) {
        currentCustomer = await findCustomer(session.token, session.user);
        setCustomer(currentCustomer);
      }
      if (!currentCustomer) {
        setOrders([]);
        return;
      }
      const allOrders = await getOrders(session.token);
      setOrders(allOrders.filter((order) => order.clienteId === currentCustomer!.id).sort((a, b) => b.id - a.id));
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : 'No se pudieron cargar tus pedidos.');
    } finally {
      setOrdersLoading(false);
    }
  }, [customer, session]);

  async function acceptSession(nextSession: Session) {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, nextSession.token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextSession.user)),
    ]);
    setSession(nextSession);
    setActiveTab('home');
    setCart([]);
  }

  async function signOut() {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    setSession(null);
    setCustomer(null);
    setOrders([]);
    setCart([]);
    setSelectedProduct(null);
    setCatalogError('');
    setOrdersError('');
    setPhone('');
    setActiveTab('home');
  }

  function addToCart(product: Product, quantity = 1) {
    const alreadyInCart = cart.find((item) => item.product.id === product.id)?.quantity ?? 0;
    if (product.stock <= 0) {
      Alert.alert('Sin stock', 'Este producto no está disponible por ahora.');
      return;
    }
    if (alreadyInCart + quantity > product.stock) {
      Alert.alert('Stock disponible', `Solo quedan ${product.stock} unidades de ${product.nombre}.`);
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (!existing) return [...current, { product, quantity }];
      return current.map((item) => item.product.id === product.id ? { ...item, product, quantity: item.quantity + quantity } : item);
    });
  }

  function changeQuantity(product: Product, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.product.id !== product.id));
      return;
    }
    if (quantity > product.stock) {
      Alert.alert('Stock disponible', `Solo quedan ${product.stock} unidades de ${product.nombre}.`);
      return;
    }
    setCart((current) => current.map((item) => item.product.id === product.id ? { ...item, quantity } : item));
  }

  async function checkout(contactPhone: string): Promise<boolean> {
    if (!session || cart.length === 0) return false;

    let currentCustomer = customer ?? await findCustomer(session.token, session.user);
    if (!currentCustomer) {
      currentCustomer = await createCustomer(session.token, session.user, contactPhone);
      await SecureStore.setItemAsync(customerKey(session.user.id), String(currentCustomer.id));
    } else if ((currentCustomer.telefono ?? '') !== contactPhone) {
      await updateCustomer(session.token, currentCustomer, contactPhone);
      currentCustomer = { ...currentCustomer, telefono: contactPhone || null };
    }

    const createdOrder = await createOrder(
      session.token,
      currentCustomer.id,
      cart.map((item) => ({ productoId: item.product.id, cantidad: item.quantity })),
    );

    setCustomer(currentCustomer);
    setPhone(contactPhone);
    await SecureStore.setItemAsync(phoneKey(session.user.id), contactPhone);
    setCart([]);
    setOrders((current) => [createdOrder, ...current.filter((order) => order.id !== createdOrder.id)]);
    setActiveTab('orders');
    Alert.alert('Pedido confirmado', `Tu pedido #${String(createdOrder.id).padStart(4, '0')} ya está registrado.`);

    void getProducts(session.token).then(setProducts).catch(() => undefined);
    return true;
  }

  async function savePhone(nextPhone: string) {
    if (!session) return;
    if (customer && (customer.telefono ?? '') !== nextPhone) {
      await updateCustomer(session.token, customer, nextPhone);
      setCustomer({ ...customer, telefono: nextPhone || null });
    }
    setPhone(nextPhone);
    await SecureStore.setItemAsync(phoneKey(session.user.id), nextPhone);
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <View style={styles.loadingMark}><Text style={styles.loadingMarkText}>N</Text></View>
        <Text style={styles.loadingTitle}>NOVA TIENDA</Text>
        <ActivityIndicator color={colors.green} style={styles.spinner} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return <><StatusBar style="dark" /><AuthScreen onAuthenticated={acceptSession} /></>;
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        {activeTab === 'home' ? (
          <HomeScreen
            name={session.user.nombre}
            categories={categories}
            products={products}
            loading={catalogLoading}
            error={catalogError}
            onRefresh={() => { void loadStore(); }}
            onSelectProduct={setSelectedProduct}
            onAdd={addToCart}
          />
        ) : null}
        {activeTab === 'cart' ? (
          <CartScreen
            items={cart}
            customer={customer}
            phone={phone}
            onPhoneChange={setPhone}
            onQuantityChange={changeQuantity}
            onRemove={(id) => setCart((current) => current.filter((item) => item.product.id !== id))}
            onCheckout={checkout}
          />
        ) : null}
        {activeTab === 'orders' ? (
          <OrdersScreen orders={orders} loading={ordersLoading} error={ordersError} onRefresh={() => { void refreshOrders(); }} />
        ) : null}
        {activeTab === 'account' ? (
          <AccountScreen
            user={session.user}
            customer={customer}
            phone={phone}
            onSavePhone={savePhone}
            onSignOut={() => { void signOut(); }}
          />
        ) : null}
      </View>
      <BottomTabs
        active={activeTab}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onSelect={(tab) => { setActiveTab(tab); if (tab === 'orders') void refreshOrders(); }}
      />
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={addToCart}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  loadingMark: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  loadingMarkText: { color: colors.surface, fontSize: 30, fontWeight: '900' },
  loadingTitle: { color: colors.ink, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 13 },
  spinner: { marginTop: 18 },
  shell: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
});
