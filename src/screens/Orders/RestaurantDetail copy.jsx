import React, { useContext, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import apiClient from '../../config/apiClient';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft,
  Heart,
  MoreVertical,
  Search,
  Minus,
  Plus,
  Star,
} from 'lucide-react-native';
import AddToCartDrawer from '../../components/AddToCartDrawer';
import { CartContext } from '../../context/CartContext';
import { FavouritesContext } from '../../context/FavouritesContext';
import { buildCartLineId, toNumber } from '../../services/cartPricing';
import { getRestaurantDetails } from '../../services/restaurantService';

const { width } = Dimensions.get('window');

export default function RestaurantDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { restaurant: initialParamRestaurant } = route.params;
  const [restaurant, setRestaurant] = useState(initialParamRestaurant || {});


  useEffect(() => {
    if (initialParamRestaurant?.id) {
      getRestaurantDetails(initialParamRestaurant.id)
        .then(data => {
          const products = data.product || [];
          const mappedItems = products.map(p => ({
            id: p._id,
            name: p.name?.en || 'Unknown Product',
            description: p.description?.en || '',
            image: 'https://placehold.co/150',
            price: p.basePrice || 0,
            isVeg: p.isVeg,
            category: 'Popular',
            available: p.available,
          }));

          const apiCuisines = Array.isArray(data.cuisine) ? data.cuisine : [];
          const categories = ['Popular', ...apiCuisines];

          setRestaurant(prev => ({
            ...prev,
            ...data,
            id: data._id,
            name: data.name?.en || prev.name,
            rating: data.rating,
            deliveryTime: `${data.deliveryTime} min`,
            minOrder: `₹${data.minOrderValue || 0}`,
            categories: categories,
            popularItems: mappedItems,
            menu: [{ category: 'Popular', items: mappedItems }],
            offers: prev.offers || [],
            freeDeliveryText: data.isFreeDelivery
              ? 'Free delivery'
              : prev.freeDeliveryText || 'Free delivery',
          }));
        })
        .catch(err => console.log('Err fetching restaurant', err));
    }
  }, [initialParamRestaurant]);

  const { cart, cartCount, totals, addToCart, incrementItem, decrementItem } =
    useContext(CartContext);

  const { isFavourite, toggleFavourite } = useContext(FavouritesContext);

  const [activeCategory, setActiveCategory] = useState('Popular');
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredItems =
    activeCategory === 'Popular'
      ? restaurant.popularItems
      : restaurant.menu?.find(m => m.category === activeCategory)?.items || [];

  const openDrawer = item => {
    setSelectedItem(item);
  };

  const closeDrawer = () => {
    setSelectedItem(null);
  };

  const restaurantId = restaurant?.id ?? null;
  const restaurantName = restaurant?.name ?? 'Restaurant';
  const deliveryTimeText = restaurant?.deliveryTime ?? '25 - 40 min';
  const freeDeliveryText =
    restaurant?.freeDeliveryText ||
    restaurant?.offers?.[0] ||
    'Free delivery for first order';
  const minOrderText =
    restaurant?.minOrder || restaurant?.minimumOrder || '₹119.00';

  const subtotal = useMemo(() => toNumber(totals?.subtotal, 0), [totals]);

  const getSimpleCartLineId = item => {
    const menuItemId = item?.id ?? null;
    return buildCartLineId({
      restaurantId,
      menuItemId,
      selectedFlavorId: null,
      addOnIds: [],
    });
  };

  const getSimpleQty = item => {
    const id = getSimpleCartLineId(item);
    const line = (Array.isArray(cart) ? cart : []).find(ci => ci.id === id);
    return toNumber(line?.quantity, 0);
  };

  const quickAdd = item => {
    const id = getSimpleCartLineId(item);
    const currentQty = getSimpleQty(item);
    if (currentQty > 0) {
      incrementItem?.(id);
      return;
    }

    addToCart?.({
      id,
      cartLineId: id,
      menuItemId: item?.id,
      name: item?.name,
      image: item?.image,
      basePrice: toNumber(item?.price, 0),
      selectedFlavor: null,
      addOns: [],
      quantity: 1,
      restaurantId,
      restaurantName,
      restaurant,
    });
  };

  const handleToggleFavourite = (item, e) => {
    e?.stopPropagation?.();
    const favId = getSimpleCartLineId(item);
    const res = toggleFavourite?.({
      favouriteId: favId,
      id: favId,
      menuItemId: item?.id,
      name: item?.name,
      image: item?.image,
      description: item?.description,
      price: toNumber(item?.price, 0),
      basePrice: toNumber(item?.price, 0),
      restaurantId,
      restaurantName,
      restaurant,
    });

    if (res?.added) {
      // As requested: when user adds a favourite, open favourites page.
      navigation.navigate('Favourite');
    }
  };



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['top']}>
      <StatusBar hidden />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 140 : 80 }}
      >
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: restaurant.coverImage }}
            style={styles.headerImage}
          />

          {/* Back button */}
          <TouchableOpacity
            style={styles.headerIconLeft}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={18} color="#000" />
          </TouchableOpacity>

          {/* Right icons */}
          <View style={styles.headerIconRightGroup}>
            <View style={styles.headerIcon}>
              <Pressable
                style={styles.headerIcon}
                onPress={() => toggleFavourite({
                  favouriteId: restaurantId,
                  id: restaurantId,
                  name: restaurantName,
                  image: restaurant.coverImage,
                  restaurant,
                })}
              >
                <Heart
                  size={18}
                  color={isFavourite?.(restaurantId) ? '#FF3D3D' : '#000'}
                  fill={isFavourite?.(restaurantId) ? '#FF3D3D' : 'transparent'}
                />
              </Pressable>

            </View>
            <View style={styles.headerIcon}>
              <MoreVertical size={18} color="#000" />
            </View>
          </View>

          {/* Rating pill */}
          <View style={styles.ratingBadge}>
            <Star size={14} color="#FFB800" fill="#FFB800" />
            <Text style={styles.ratingText}>{restaurant.rating}</Text>
            <Text style={styles.ratingSubText}>
              ({restaurant.totalRatings})
            </Text>
          </View>
        </View>

        {/* ===== INFO ===== */}
        <View style={styles.infoBox}>
          <View style={styles.topRow}>
            <Image
              source={{ uri: restaurant.coverImage }}
              style={styles.resThumb}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{restaurant.name}</Text>
              <Text style={styles.meta}>
                {(restaurant.cuisines || []).join(', ')}
              </Text>
            </View>
          </View>

          <View style={styles.deliveryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryText}>
                Delivery {deliveryTimeText}
              </Text>
              <Text style={styles.freeDeliveryText}>{freeDeliveryText}</Text>
              <Text style={styles.minOrderText}>
                Min order - {minOrderText}
              </Text>
            </View>
            <TouchableOpacity style={styles.changeBtn} activeOpacity={0.9}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== SEARCH ===== */}
        <View style={styles.searchBox}>
          <Search size={18} color="#9AA0A6" />
          <Text style={styles.searchPlaceholder}>Search Dish Name....</Text>
        </View>

        {/* ===== CATEGORIES ===== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catRow}
        >
          {(restaurant.categories || []).map(cat => (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}>
              <View
                style={[
                  styles.catPill,
                  activeCategory === cat && styles.catPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.catText,
                    activeCategory === cat && styles.catTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ===== ITEMS ===== */}
        <View style={styles.itemsCardWrap}>
          <View style={styles.itemsHeader}>
            <Text style={styles.itemsTitle}>{activeCategory}</Text>
            <Text style={styles.itemsSubTitle}>Most Order right now</Text>
          </View>

          {(Array.isArray(filteredItems) ? filteredItems : []).map(
            (item, index, arr) => {
              const qty = getSimpleQty(item);
              const favId = getSimpleCartLineId(item);
              const favOn = isFavourite?.(favId);
              const itemSubtitle =
                item?.subtitle ||
                item?.shortDescription ||
                item?.description ||
                '';
              const itemDesc = item?.detail || item?.description || '';
              return (
                <View key={item.id}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openDrawer(item)}
                    style={styles.itemRow}
                  >
                    <View style={styles.itemImgWrap}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.itemImg}
                      />
                      <Pressable
                        style={styles.itemFavBtn}
                        hitSlop={10}
                        onPress={e => handleToggleFavourite(item, e)}
                      >
                        <Heart
                          size={14}
                          color={favOn ? '#FF3D3D' : '#111'}
                          fill={favOn ? '#FF3D3D' : 'transparent'}
                        />
                      </Pressable>
                    </View>

                    <View style={styles.itemContent}>
                      <Text style={styles.itemPrice}>₹{item.price}</Text>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {!!itemSubtitle && (
                        <Text style={styles.itemSubtitle} numberOfLines={1}>
                          {itemSubtitle}
                        </Text>
                      )}
                      {!!itemDesc && (
                        <Text style={styles.desc} numberOfLines={2}>
                          {itemDesc}
                        </Text>
                      )}

                      {item.isBestSeller && (
                        <Text style={styles.bestSeller}>Highly Reordered</Text>
                      )}

                      {qty > 0 && (
                        <View style={styles.addedRow}>
                          <View style={styles.stepper}>
                            <Pressable
                              style={styles.stepBtn}
                              hitSlop={10}
                              onPress={() =>
                                decrementItem?.(getSimpleCartLineId(item))
                              }
                            >
                              <Minus size={12} color="#111" />
                            </Pressable>
                            <Text style={styles.stepQty}>{qty}</Text>
                            <Pressable
                              style={styles.stepBtn}
                              hitSlop={10}
                              onPress={() =>
                                incrementItem?.(getSimpleCartLineId(item))
                              }
                            >
                              <Plus size={12} color="#111" />
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>

                    {qty === 0 ? (
                      <Pressable
                        style={styles.addPlusBtn}
                        hitSlop={10}
                        onPress={() => quickAdd(item)}
                      >
                        <Plus size={14} color="#111" />
                      </Pressable>
                    ) : null}
                  </TouchableOpacity>
                  {index < arr.length - 1 ? (
                    <View style={styles.itemDivider} />
                  ) : null}
                </View>
              );
            },
          )}
        </View>

        {/* ===== REVIEWS ===== */}
        <Text style={styles.reviewTitle}>Fellow foodies say</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reviewList}
        >
          {(restaurant.reviews || []).map(r => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View style={styles.reviewStars}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={`${r.id}-star-${index}`}
                      size={14}
                      color={index < (r.rating ?? 4) ? '#FF8A00' : '#F2D2B6'}
                      fill={index < (r.rating ?? 4) ? '#FF8A00' : 'transparent'}
                    />
                  ))}
                </View>
                <Text style={styles.reviewUser}>• {r.user}</Text>
                <Text style={styles.reviewTime}>{r.time}</Text>
              </View>
              <Text style={styles.reviewText} numberOfLines={3}>
                {r.comment}
              </Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {cartCount > 0 && (
        <View style={styles.cartBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cartBarTitle}>Items in cart: {cartCount}</Text>
            <Text style={styles.cartBarSub}>Subtotal ₹{subtotal}</Text>
          </View>

          <TouchableOpacity
            style={styles.cartBtn}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.cartBtnText}>Go to Cart</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddToCartDrawer
        visible={!!selectedItem}
        item={selectedItem}
        restaurant={restaurant}
        onClose={closeDrawer}
        currencySymbol="₹"
        onAddToCart={() => {
          closeDrawer();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    position: 'relative',
  },

  cover: {
    width: '100%',
    height: 260,
  },

  headerTopShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },

  headerBottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },

  back: {
    position: 'absolute',
    top: 8,
    left: 16,
    backgroundColor: '#FFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  topIcons: {
    position: 'absolute',
    top: 8,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },

  iconCircle: {
    width: 36,
    height: 36,
    backgroundColor: '#FFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  headerBadgeRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  ratingPillText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
  },

  ratingPillSub: {
    color: '#6E6E6E',
    fontWeight: '700',
    fontSize: 12,
  },

  infoBox: {
    padding: 16,
    marginTop: -28,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  topRow: {
    flexDirection: 'row',
    gap: 12,
  },

  resThumb: {
    width: 86,
    height: 96,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    top: -50,
  },

  name: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },

  meta: {
    color: '#7A7A7A',
    marginTop: 4,
    fontSize: 12,
  },

  deliveryRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  deliveryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },

  freeDeliveryText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#FF3D3D',
  },

  minOrderText: {
    marginTop: 4,
    fontSize: 12,
    color: '#7A7A7A',
    fontWeight: '600',
  },

  changeBtn: {
    marginLeft: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#FFFFFF',
  },

  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },

  searchBox: {
    margin: 16,
    backgroundColor: '#F2F4F7',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchPlaceholder: {
    color: '#9AA0A6',
    fontSize: 13,
    fontWeight: '600',
  },

  catRow: {
    paddingLeft: 16,
    marginBottom: 10,
  },

  catPill: {
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#F2F4F7',
  },

  catPillActive: {
    backgroundColor: '#FF3D3D',
  },

  catText: {
    color: '#6F6F6F',
    fontWeight: '800',
    fontSize: 12,
  },

  catTextActive: {
    color: '#FFF',
  },

  itemsHeader: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
  },

  itemsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },

  itemsSubTitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#7A7A7A',
    fontWeight: '600',
  },

  itemsCardWrap: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingBottom: 8,
  },

  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },

  itemDivider: {
    height: 1,
    backgroundColor: '#EDEDED',
    marginHorizontal: 12,
    marginVertical: 6,
  },

  itemImgWrap: {
    position: 'relative',
    marginRight: 10,
  },

  itemFavBtn: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  itemImg: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },

  itemContent: {
    flex: 1,
  },

  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },

  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
    marginBottom: 2,
  },

  itemSubtitle: {
    marginTop: 1,
    fontSize: 12,
    color: '#222',
    fontWeight: '600',
  },

  desc: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },

  bestSeller: {
    color: '#D84C4C',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '700',
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },

  addPlusBtn: {
    position: 'absolute',
    right: 12,
    top: 18,
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#E6E6E6',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },

  addedRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 40,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 6,
    height: 24,
    backgroundColor: '#FFF',
  },

  stepBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepQty: {
    minWidth: 16,
    textAlign: 'center',
    fontWeight: '900',
    color: '#111',
    fontSize: 11,
    marginHorizontal: 2,
  },

  cartBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cartBarTitle: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
  },

  cartBarSub: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 2,
  },

  cartBtn: {
    backgroundColor: '#FF3D3D',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  cartBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
  },

  reviewTitle: {
    margin: 16,
    fontSize: 18,
    fontWeight: '700',
  },

  reviewList: {
    paddingLeft: 16,
    paddingRight: 6,
    paddingBottom: 8,
  },

  reviewCard: {
    width: 300,
    backgroundColor: '#FFFDF5',
    marginRight: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3A15C',
  },

  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  reviewUser: {
    fontWeight: '700',
    fontSize: 13,
    color: '#111',
  },

  reviewText: {
    marginTop: 8,
    color: '#222',
    fontSize: 12,
    lineHeight: 16,
  },

  reviewTime: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  headerContainer: {
    position: 'relative',
  },

  headerImage: {
    width: '100%',
    height: 280,
  },

  headerIconLeft: {
    position: 'absolute',
    top: 24,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  headerIconRightGroup: {
    position: 'absolute',
    top: 24,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  ratingBadge: {
    position: 'absolute',
    bottom: 35,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    elevation: 4,
  },

  ratingText: {
    marginLeft: 6,
    fontWeight: '800',
    fontSize: 13,
    color: '#000',
  },

  ratingSubText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
});
