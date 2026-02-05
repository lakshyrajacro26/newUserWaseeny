import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from 'lucide-react-native';

import { FavouritesContext } from '../context/FavouritesContext';
import { CartContext } from '../context/CartContext';
import { toNumber } from '../services/cartPricing';
import { SafeAreaView } from 'react-native-safe-area-context';

const FALLBACK_IMG = require('../assets/images/Noodle.png');

function imgSource(uri) {
  if (typeof uri === 'string' && uri.trim().length > 0) return { uri };
  return FALLBACK_IMG;
}

export default function Favourite() {
  const navigation = useNavigation();
  const { favourites, favouritesCount, removeFavourite } =
    useContext(FavouritesContext);
  const { cartCount, addToCart } = useContext(CartContext);

  const grouped = useMemo(() => {
    const map = new Map();
    (Array.isArray(favourites) ? favourites : []).forEach(f => {
      const key = String(f.restaurantId ?? f.restaurantName ?? 'na');
      if (!map.has(key)) {
        map.set(key, {
          restaurantName: f.restaurantName ?? 'Restaurant',
          items: [],
        });
      }
      map.get(key).items.push(f);
    });
    return Array.from(map.values());
  }, [favourites]);

  const hasFav = favouritesCount > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color="#111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Favourites</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('MainTabs', {
              screen: 'Home',
              params: { screen: 'Cart' },
            })
          }
        >
          <ShoppingBag size={20} color="#111" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {!hasFav ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Heart size={26} color="#FF3D3D" />
          </View>
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptySub}>
            Tap the heart on any dish to save it here.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <Text style={styles.primaryBtnText}>Browse dishes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <Text style={styles.title}>My favourites</Text>

          {grouped.map((group, idx) => (
            <View key={String(idx)} style={styles.group}>
              <Text style={styles.groupTitle}>{group.restaurantName}</Text>

              {group.items.map(item => (
                <View key={item.id} style={styles.card}>
                  <Image source={imgSource(item.image)} style={styles.img} />

                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={styles.name}>
                      {item.name}
                    </Text>
                    {!!item.description && (
                      <Text numberOfLines={2} style={styles.desc}>
                        {item.description}
                      </Text>
                    )}
                    <Text style={styles.price}>₹{toNumber(item.price, 0)}</Text>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.addBtn}
                        onPress={() =>
                          addToCart?.({
                            cartLineId: item.id,
                            id: item.id,
                            menuItemId: item.menuItemId,
                            name: item.name,
                            image: item.image,
                            basePrice: toNumber(
                              item.basePrice ?? item.price,
                              0,
                            ),
                            price: toNumber(item.basePrice ?? item.price, 0),
                            selectedFlavor: null,
                            addOns: [],
                            quantity: 1,
                            restaurantId: item.restaurantId,
                            restaurantName: item.restaurantName,
                          })
                        }
                      >
                        <Text style={styles.addBtnText}>ADD TO CART</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.removeBtn}
                        onPress={() => removeFavourite?.(item.id)}
                      >
                        <Trash2 size={18} color="#999" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F6F6' },

  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#111' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },

  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  emptyWrap: {
    flex: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: 'rgba(255,61,61,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 14, fontSize: 18, fontWeight: '900', color: '#111' },
  emptySub: {
    marginTop: 8,
    color: '#777',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryBtn: {
    marginTop: 18,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '900' },

  scroll: { padding: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 12 },

  group: { marginBottom: 18 },
  groupTitle: { color: '#777', fontWeight: '800', marginBottom: 10 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  img: { width: 64, height: 64, borderRadius: 14, marginRight: 12 },
  name: { fontWeight: '900', color: '#111', fontSize: 14 },
  desc: { marginTop: 4, color: '#777', fontWeight: '600', fontSize: 12 },
  price: { marginTop: 8, color: '#111', fontWeight: '900' },
  actions: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  addBtn: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,61,61,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  addBtnText: { color: '#FF3D3D', fontWeight: '900', fontSize: 12 },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
