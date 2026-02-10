import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Heart, ShoppingBag, Minus, Plus } from 'lucide-react-native';

import { FavouritesContext } from '../context/FavouritesContext';
import { CartContext } from '../context/CartContext';
import { toNumber } from '../services/cartPricing';
import { SafeAreaView } from 'react-native-safe-area-context';

const FALLBACK_IMG = require('../assets/images/Noodle.png');

function imgSource(uri) {
  if (typeof uri === 'string' && uri.trim().length > 0) return { uri };
  return FALLBACK_IMG;
}

function getLocalizedText(value) {
  if (!value) return '';
  if (typeof value === 'object') {
    return value.en || value.de || value.ar || '';
  }
  return String(value);
}

export default function Favourite() {
  const navigation = useNavigation();
  const { favourites, favouritesCount, toggleFavourite, isLoading, fetchFavourites } =
    useContext(FavouritesContext);
  const { cartCount, cart, addToCart, incrementItem, decrementItem } = useContext(CartContext);

  // Extract restaurant ID properly
  const getRestaurantId = (item) => {
    if (typeof item.restaurantId === 'object' && item.restaurantId?._id) {
      return item.restaurantId._id;
    }
    return item.restaurantId || null;
  };

  // Get cart quantity for an item
  const getCartQuantity = (item) => {
    if (!Array.isArray(cart)) return 0;
    const restaurantId = getRestaurantId(item);
    const cartItem = cart.find(
      ci =>
        String(ci.menuItemId ?? ci.productId ?? '') === String(item.menuItemId) &&
        String(ci.restaurantId ?? '') === String(restaurantId)
    );
    return toNumber(cartItem?.quantity, 0);
  };

  // Get cart line ID for an item
  const getCartLineId = (item) => {
    if (!Array.isArray(cart)) return null;
    const restaurantId = getRestaurantId(item);
    const cartItem = cart.find(
      ci =>
        String(ci.menuItemId ?? ci.productId ?? '') === String(item.menuItemId) &&
        String(ci.restaurantId ?? '') === String(restaurantId)
    );
    return cartItem?.id ?? null;
  };

  // Separate restaurants and products
  const { restaurants, productsByRestaurant } = useMemo(() => {
    const restaurantFavs = [];
    const productMap = new Map();
    
    (Array.isArray(favourites) ? favourites : []).forEach(f => {
      if (f.type === 'restaurant') {
        restaurantFavs.push(f);
      } else {
        // Products
        const key = String(f.restaurantId ?? f.restaurantName ?? 'na');
        if (!productMap.has(key)) {
          productMap.set(key, {
            restaurantName: f.restaurantName ?? 'Restaurant',
            items: [],
          });
        }
        productMap.get(key).items.push(f);
      }
    });
    
    return {
      restaurants: restaurantFavs,
      productsByRestaurant: Array.from(productMap.values()),
    };
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

      {!hasFav && !isLoading ? (
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
      ) : isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FF3D3D" />
          <Text style={styles.loadingText}>Loading favourites...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <Text style={styles.title}>My favourites</Text>

          {/* Favorite Restaurants */}
          {restaurants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Restaurants</Text>
              {restaurants.map(restaurant => {
                const restaurantName = getLocalizedText(restaurant.name);
                const restaurantDesc = getLocalizedText(restaurant.description);
                
                return (
                  <TouchableOpacity
                    key={restaurant.id}
                    style={styles.restaurantCard}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('MainTabs', {
                        screen: 'Home',
                        params: {
                          screen: 'RestaurantDetail',
                          params: {
                            restaurant: {
                              id: restaurant.restaurantId || restaurant.id,
                              _id: restaurant.restaurantId || restaurant.id,
                              name: restaurantName,
                              image: restaurant.image,
                              bannerImage: restaurant.image,
                            },
                          },
                        },
                      })
                    }
                  >
                    <Image source={imgSource(restaurant.image)} style={styles.restaurantImg} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={2} style={styles.restaurantName}>
                        {restaurantName}
                      </Text>
                      {!!restaurantDesc && (
                        <Text numberOfLines={2} style={styles.desc}>
                          {restaurantDesc}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.heartBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFavourite?.({
                          id: restaurant.restaurantId || restaurant.id,
                          restaurantId: restaurant.restaurantId || restaurant.id,
                          name: restaurantName,
                          image: restaurant.image,
                          restaurantName: restaurantName,
                          type: 'restaurant',
                        });
                      }}
                    >
                      <Heart size={20} color="#FF3D3D" fill="#FF3D3D" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Favorite Products/Items */}
          {productsByRestaurant.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items</Text>
              {productsByRestaurant.map((group, idx) => (
                <View key={String(idx)} style={styles.group}>
                  <Text style={styles.groupTitle}>{getLocalizedText(group.restaurantName)}</Text>

                  {group.items.map(item => {
                    const itemName = getLocalizedText(item.name);
                    const itemDesc = getLocalizedText(item.description);
                    const cartQty = getCartQuantity(item);
                    const cartLineId = getCartLineId(item);
                    const productId = item.menuItemId ?? item.productId ?? item.id ?? null;
                    
                    return (
                      <View key={item.id} style={styles.itemCard}>
                        <Image source={imgSource(item.image)} style={styles.itemImg} />

                        {/* Quantity overlay like cart page */}
                        {cartQty > 0 && (
                          <View style={styles.qtyOverlay} pointerEvents="box-none">
                            <View style={styles.qtyWrap}>
                              <TouchableOpacity
                                onPress={() => {
                                  if (cartLineId) {
                                    decrementItem?.(cartLineId);
                                  }
                                }}
                                style={styles.qtyBtnOverlay}
                                activeOpacity={0.8}
                              >
                                <Minus size={14} color="#E53935" />
                              </TouchableOpacity>

                              <Text style={styles.qtyTextOverlay}>{cartQty}</Text>

                              <TouchableOpacity
                                onPress={() => {
                                  if (cartLineId) {
                                    incrementItem?.(cartLineId);
                                  }
                                }}
                                style={styles.qtyBtnOverlay}
                                activeOpacity={0.8}
                              >
                                <Plus size={14} color="#E53935" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={2} style={styles.itemName}>
                            {itemName}
                          </Text>
                          {!!itemDesc && (
                            <Text numberOfLines={2} style={styles.itemDesc}>
                              {itemDesc}
                            </Text>
                          )}
                          
                          <View style={styles.itemBottomRow}>
                            <Text style={styles.itemPrice}>₹{toNumber(item.price, 0)}</Text>
                            
                            {cartQty === 0 && (
                              <TouchableOpacity
                                activeOpacity={0.9}
                                style={styles.addBtnSmall}
                                onPress={() => {
                                  const restaurantId = getRestaurantId(item);
                                  if (!restaurantId || !item.menuItemId) {
                                    console.error('Missing restaurantId or menuItemId:', { 
                                      restaurantId, 
                                      menuItemId: item.menuItemId,
                                      item 
                                    });
                                    return;
                                  }
                                  
                                  addToCart?.({
                                    cartLineId: item.id,
                                    id: item.id,
                                    menuItemId: item.menuItemId,
                                    name: itemName,
                                    image: item.image,
                                    basePrice: toNumber(
                                      item.basePrice ?? item.price,
                                      0,
                                    ),
                                    price: toNumber(item.basePrice ?? item.price, 0),
                                    selectedFlavor: null,
                                    addOns: [],
                                    quantity: 1,
                                    restaurantId: restaurantId,
                                    restaurantName: getLocalizedText(item.restaurantName),
                                  });
                                }}
                              >
                                <Text style={styles.addBtnSmallText}>ADD</Text>
                              </TouchableOpacity>
                            )}
                            
                            <TouchableOpacity
                              activeOpacity={0.85}
                              style={styles.heartBtnSmall}
                              onPress={() => {
                                if (!productId) {
                                  console.warn('Missing productId for favorite toggle:', item);
                                  return;
                                }
                                toggleFavourite?.({
                                  id: item.id,
                                  menuItemId: productId,
                                  name: itemName,
                                  image: item.image,
                                  description: itemDesc,
                                  price: toNumber(item.price, 0),
                                  basePrice: toNumber(item.basePrice ?? item.price, 0),
                                  restaurantId: getRestaurantId(item),
                                  restaurantName: getLocalizedText(item.restaurantName),
                                  type: 'product',
                                });
                              }}
                            >
                              <Heart size={18} color="#FF3D3D" fill="#FF3D3D" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 8,
    color: '#777',
    fontWeight: '600',
    fontSize: 14,
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

  section: { marginBottom: 24 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#111', 
    marginBottom: 12 
  },

  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  restaurantImg: { 
    width: 80, 
    height: 80, 
    borderRadius: 14, 
    marginRight: 12 
  },
  restaurantName: { 
    fontWeight: '900', 
    color: '#111', 
    fontSize: 16,
    marginBottom: 4,
  },
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,61,61,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  group: { marginBottom: 18 },
  groupTitle: { color: '#777', fontWeight: '800', marginBottom: 10 },

  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemImg: { 
    width: 64, 
    height: 64, 
    borderRadius: 14, 
    marginRight: 12 
  },
  qtyOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtnOverlay: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyTextOverlay: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '900',
    color: '#E53935',
    fontSize: 12,
  },
  itemName: { fontWeight: '900', color: '#111', fontSize: 14 },
  itemDesc: { marginTop: 4, color: '#777', fontWeight: '600', fontSize: 12 },
  itemBottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemPrice: { flex: 1, fontWeight: '900', color: '#111', fontSize: 14 },
  addBtnSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,61,61,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnSmallText: { 
    color: '#FF3D3D', 
    fontWeight: '900', 
    fontSize: 12 
  },
  heartBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,61,61,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
