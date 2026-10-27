import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Category, Product } from '../types';
import { colors, shadow } from '../theme';
import { EmptyState, PageHeading } from '../components/ui';

type Props = {
  name: string;
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onSelectProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
};

export function categoryEmoji(name?: string | null) {
  const value = (name ?? '').toLowerCase();
  if (value.includes('electr')) return '🎧';
  if (value.includes('ropa') || value.includes('moda')) return '👕';
  if (value.includes('hogar')) return '🪴';
  return '✨';
}

function categoryColor(id: number) {
  const palette = [colors.greenLight, colors.orangeLight, colors.lavender, '#E8EEF5'];
  return palette[Math.abs(id) % palette.length];
}

export function HomeScreen({ name, categories, products, loading, error, onRefresh, onSelectProduct, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const firstName = name.trim().split(/\s+/)[0] || 'bienvenido';

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const matchesCategory = activeCategory === null || product.categoriaId === activeCategory;
      const matchesQuery = !normalized || `${product.nombre} ${product.descripcion ?? ''} ${product.categoriaNombre ?? ''}`.toLocaleLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, products, query]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.green} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>BUEN DÍA, {firstName.toLocaleUpperCase()}</Text>
          <Text style={styles.brand}>NOVA <Text style={styles.brandAccent}>TIENDA</Text></Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{firstName.charAt(0).toLocaleUpperCase()}</Text></View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>UN BUEN DÍA EMPIEZA AQUÍ</Text>
          <Text style={styles.heroTitle}>Encuentra eso que te hace falta.</Text>
          <Text style={styles.heroFoot}>Explora nuestra selección de temporada.</Text>
        </View>
        <View style={styles.heroArt}><Text style={styles.heroBag}>🛍️</Text><Text style={styles.heroStar}>✦</Text></View>
        <View style={styles.heroIndex}><View style={styles.heroIndexDot} /><Text style={styles.heroIndexText}>01  /  03</Text></View>
      </View>

      <View style={styles.search}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="¿Qué estás buscando?"
          placeholderTextColor="#929D97"
          returnKeyType="search"
          style={styles.searchInput}
          accessibilityLabel="Buscar productos"
        />
        {query ? <Pressable onPress={() => setQuery('')} hitSlop={8}><Text style={styles.clearSearch}>×</Text></Pressable> : null}
      </View>

      <View style={styles.sectionTop}>
        <PageHeading eyebrow="Encuentra tu estilo" title="Categorías" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
        <CategoryChip label="Todo" icon="✦" selected={activeCategory === null} onPress={() => setActiveCategory(null)} />
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.nombre}
            icon={categoryEmoji(category.nombre)}
            selected={activeCategory === category.id}
            onPress={() => setActiveCategory(category.id)}
          />
        ))}
      </ScrollView>

      <View style={[styles.sectionTop, styles.productsHeading]}>
        <PageHeading
          eyebrow="Selección para ti"
          title={query || activeCategory !== null ? 'Resultados' : 'Más populares'}
          detail={`${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'} disponibles`}
        />
        <Text style={styles.sortText}>NOVA ✦</Text>
      </View>

      {loading && products.length === 0 && !error ? (
        <View style={styles.loadingCatalog}><ActivityIndicator color={colors.green} /><Text style={styles.loadingText}>Cargando la tienda…</Text></View>
      ) : error ? (
        <EmptyState icon="📡" title="No conectamos con la tienda" description={error} action={<Pressable onPress={onRefresh}><Text style={styles.retry}>Intentar de nuevo ↗</Text></Pressable>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔎" title="No encontramos productos" description="Prueba otra búsqueda o explora todas las categorías." action={<Pressable onPress={() => { setQuery(''); setActiveCategory(null); }}><Text style={styles.retry}>Ver toda la tienda ↗</Text></Pressable>} />
      ) : (
        <View style={styles.grid}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onPress={() => onSelectProduct(product)} onAdd={() => onAdd(product)} />
          ))}
        </View>
      )}
      <View style={styles.bottomNote}><Text style={styles.bottomNoteText}>HECHO PARA TU DÍA <Text style={styles.bottomNoteStar}>✦</Text> NOVA TIENDA</Text></View>
    </ScrollView>
  );
}

function CategoryChip({ label, icon, selected, onPress }: { label: string; icon: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.categoryChip, selected && styles.categoryChipActive, pressed && styles.pressed]}>
      <Text style={[styles.categoryIcon, selected && styles.categoryIconActive]}>{icon}</Text>
      <Text style={[styles.categoryLabel, selected && styles.categoryLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function ProductCard({ product, onPress, onAdd }: { product: Product; onPress: () => void; onAdd: () => void }) {
  const noStock = product.stock <= 0;
  return (
    <View style={styles.productCard}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        <View style={[styles.productArt, { backgroundColor: categoryColor(product.categoriaId) }]}>
          <View style={styles.productTag}><Text style={styles.productTagText}>{product.categoriaNombre ?? 'NOVA'}</Text></View>
          <Text style={styles.productEmoji}>{categoryEmoji(product.categoriaNombre)}</Text>
          <View style={styles.artSparkle}><Text style={styles.artSparkleText}>✦</Text></View>
        </View>
        <View style={styles.productInfo}>
          <Text numberOfLines={1} style={styles.productName}>{product.nombre}</Text>
          <Text numberOfLines={2} style={styles.productDescription}>{product.descripcion?.trim() || 'Un favorito para todos los días.'}</Text>
        </View>
      </Pressable>
      <View style={styles.productBottom}>
        <View>
          <Text style={styles.productPrice}>Bs {Number(product.precio).toFixed(2)}</Text>
          <Text style={[styles.stockText, noStock && styles.noStock]}>{noStock ? 'Agotado' : `${product.stock} disponibles`}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Agregar ${product.nombre} al carrito`}
          disabled={noStock}
          onPress={onAdd}
          style={({ pressed }) => [styles.addButton, noStock && styles.addDisabled, pressed && !noStock && styles.pressed]}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  greeting: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.35, marginBottom: 3 },
  brand: { color: colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: 1.1 },
  brandAccent: { color: colors.green, fontWeight: '700' },
  avatar: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.orangeLight, borderWidth: 2, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  avatarText: { color: colors.greenDark, fontSize: 17, fontWeight: '900' },
  hero: { minHeight: 196, backgroundColor: colors.greenDark, borderRadius: 26, overflow: 'hidden', padding: 21, justifyContent: 'center', marginBottom: 17 },
  heroCopy: { maxWidth: '72%', zIndex: 1 },
  heroEyebrow: { color: '#B7D8C5', fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 10 },
  heroTitle: { color: colors.surface, fontSize: 25, lineHeight: 29, fontWeight: '800', letterSpacing: -0.5 },
  heroFoot: { color: '#D8E7DE', fontSize: 11, lineHeight: 17, marginTop: 8 },
  heroArt: { position: 'absolute', right: -11, top: 7, width: 145, height: 150, borderRadius: 80, backgroundColor: '#2C715A', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  heroBag: { fontSize: 67, transform: [{ rotate: '-8deg' }] },
  heroStar: { color: colors.orange, fontSize: 25, position: 'absolute', top: 15, right: 25 },
  heroIndex: { flexDirection: 'row', gap: 7, alignItems: 'center', position: 'absolute', bottom: 17, left: 21 },
  heroIndexDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
  heroIndexText: { color: '#D8E7DE', fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  search: { minHeight: 52, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 17, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9, marginBottom: 24 },
  searchIcon: { color: colors.green, fontSize: 26, lineHeight: 30 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 10 },
  clearSearch: { color: colors.muted, fontSize: 24, lineHeight: 28, paddingHorizontal: 3 },
  sectionTop: { marginBottom: 11 },
  categoryList: { gap: 9, paddingBottom: 6 },
  categoryChip: { minHeight: 42, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 7 },
  categoryChipActive: { backgroundColor: colors.green, borderColor: colors.green },
  categoryIcon: { fontSize: 13, color: colors.muted },
  categoryIconActive: { color: colors.surface },
  categoryLabel: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  categoryLabelActive: { color: colors.surface },
  productsHeading: { marginTop: 22, marginBottom: 13, flexDirection: 'row', alignItems: 'flex-end' },
  sortText: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  productCard: { width: '48.5%', padding: 9, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.line },
  productArt: { height: 130, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productTag: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.84)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5, maxWidth: '76%' },
  productTagText: { color: colors.greenDark, fontSize: 8, fontWeight: '800' },
  productEmoji: { fontSize: 48 },
  artSparkle: { position: 'absolute', right: 11, bottom: 8 },
  artSparkleText: { color: colors.green, fontSize: 14 },
  productInfo: { paddingHorizontal: 3, paddingTop: 10, minHeight: 67 },
  productName: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  productDescription: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 4 },
  productBottom: { borderTopWidth: 1, borderTopColor: '#EEF0ED', marginTop: 7, paddingTop: 9, paddingHorizontal: 3, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { color: colors.greenDark, fontSize: 13, fontWeight: '900' },
  stockText: { color: colors.muted, fontSize: 9, marginTop: 3 },
  noStock: { color: colors.red },
  addButton: { width: 33, height: 33, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  addDisabled: { backgroundColor: '#D8DEDA' },
  addButtonText: { color: colors.surface, fontSize: 24, fontWeight: '500', lineHeight: 28 },
  pressed: { opacity: 0.76 },
  retry: { color: colors.green, fontSize: 13, fontWeight: '800' },
  loadingCatalog: { minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: colors.muted, fontSize: 12 },
  bottomNote: { alignItems: 'center', paddingTop: 24, paddingBottom: 3 },
  bottomNoteText: { color: '#9AA49F', fontSize: 8, fontWeight: '800', letterSpacing: 1.15 },
  bottomNoteStar: { color: colors.orange, fontSize: 11 },
});
