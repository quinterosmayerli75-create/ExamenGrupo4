import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type Tab = 'home' | 'cart' | 'orders' | 'account';

const items: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Inicio', icon: '⌂' },
  { id: 'cart', label: 'Carrito', icon: '▣' },
  { id: 'orders', label: 'Pedidos', icon: '▤' },
  { id: 'account', label: 'Cuenta', icon: '◉' },
];

type Props = { active: Tab; cartCount: number; onSelect: (tab: Tab) => void };

export function BottomTabs({ active, cartCount, onSelect }: Props) {
  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const selected = active === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onSelect(item.id)}
            style={styles.item}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
              <Text style={[styles.icon, selected && styles.iconActive]}>{item.icon}</Text>
              {item.id === 'cart' && cartCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text></View> : null}
            </View>
            <Text style={[styles.label, selected && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: 68, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  item: { minWidth: 60, alignItems: 'center', gap: 3 },
  iconWrap: { width: 44, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: colors.greenLight },
  icon: { color: '#89938E', fontSize: 18, lineHeight: 22 },
  iconActive: { color: colors.green, fontWeight: '800' },
  label: { color: '#89938E', fontSize: 9, fontWeight: '600' },
  labelActive: { color: colors.green, fontWeight: '800' },
  badge: { minWidth: 14, height: 14, borderRadius: 7, backgroundColor: colors.orange, position: 'absolute', top: -1, right: 3, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: colors.greenDark, fontSize: 8, fontWeight: '900' },
});
