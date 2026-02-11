import React, { useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
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
import { getRestaurantMenu } from '../../services/restaurantService';

const restaurantMenuCache = new Map();
const MENU_CACHE_VERSION = 'menu-map-v2';

export default function RestaurantDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { restaurant: initialParamRestaurant } = route.params;
  const isMountedRef = useRef(true);

  const [restaurant, setRestaurant] = useState(() => {
    const name = typeof initialParamRestaurant?.name === 'object'
      ? initialParamRestaurant?.name?.en ?? 'Restaurant'
      : initialParamRestaurant?.name ?? 'Restaurant';
    
    const cuisines = Array.isArray(initialParamRestaurant?.cuisine)
      ? initialParamRestaurant.cuisine
      : (Array.isArray(initialParamRestaurant?.cuisines) ? initialParamRestaurant.cuisines : []);
    
    return {
      id: initialParamRestaurant?.id ?? initialParamRestaurant?._id ?? null,
      _id: initialParamRestaurant?._id ?? initialParamRestaurant?.id ?? null,
      name,
      ratingAverage: typeof initialParamRestaurant?.rating?.average === 'number'
        ? initialParamRestaurant.rating.average
        : typeof initialParamRestaurant?.rating === 'number'
          ? initialParamRestaurant.rating
          : 0,
      ratingCount: typeof initialParamRestaurant?.rating?.count === 'number'
        ? initialParamRestaurant.rating.count
        : initialParamRestaurant?.ratingCount ?? 0,
      deliveryTime: initialParamRestaurant?.deliveryTime ?? 30,
      minOrderValue: initialParamRestaurant?.minOrderValue ?? 0,
      cuisines,
      image: initialParamRestaurant?.image ?? '',
      bannerImage: initialParamRestaurant?.bannerImage ?? '',
      isFreeDelivery: initialParamRestaurant?.isFreeDelivery ?? false,
      freeDeliveryText: initialParamRestaurant?.isFreeDelivery ? 'Free delivery' : '',
      minOrder: initialParamRestaurant?.minOrderValue ? `₹${initialParamRestaurant.minOrderValue}` : '',
      categories: [],
      popularItems: [],
      menu: [],
      reviews: [],
      offers: [],
    };
  });

  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState(null);

  const restaurantParamId =
    initialParamRestaurant?.id ?? initialParamRestaurant?._id ?? null;

  const fetchMenu = useCallback(async () => {
    if (!restaurantParamId) {
      setMenuError('Restaurant ID is missing.');
      return;
    }

    if (restaurantMenuCache.has(restaurantParamId)) {
      const cached = restaurantMenuCache.get(restaurantParamId);
      if (cached?.version === MENU_CACHE_VERSION) {
        setRestaurant(prev => ({
          ...prev,
          ...cached.restaurant,
        }));
        setActiveCategory(cached.activeCategory || null);
        return;
      }
    }

    setMenuLoading(true);
    setMenuError(null);

    try {
      const data = await getRestaurantMenu(restaurantParamId);
      
      const restaurantPayload = data?.restaurant || null;
      const categoriesFromApi = Array.isArray(data?.categories)
        ? data.categories
        : [];
      const products = Array.isArray(data?.products)
        ? data.products
        : [];
      const menuByCategoryIdFromApi =
        data?.menuByCategoryId && typeof data.menuByCategoryId === 'object'
          ? data.menuByCategoryId
          : null;

      const menuMap =
        data?.menu && typeof data.menu === 'object' && !Array.isArray(data.menu)
          ? data.menu
          : null;
      if (!isMountedRef.current) return;

      const getLocalizedText = value => {
        if (!value) return '';
        if (typeof value === 'object') {
          return value.en || value.de || value.ar || '';
        }
        return String(value);
      };

      // Build categories list and map from API data
      const categoriesWithIds = categoriesFromApi.map(c => {
        const id = String(c?._id || c?.id || '').trim();
        const name = getLocalizedText(c?.name) || 'Unknown';
        return { id, name };
      }).filter(c => c.id);

      const mapMenuItem = (item, index, categoryId) => {
        return {
          id: item?._id || item?.id || `${categoryId || 'item'}-${index}`,
          name: getLocalizedText(item?.name) || 'Unknown Product',
          description: getLocalizedText(item?.description) || '',
          image: item?.image || 'https://placehold.co/150',
          bannerimage: item?.bannerImage || 'https://placehold.co/150',
          price: item?.basePrice ?? item?.price ?? 0,
          isVeg: item?.isVeg,
          categoryId: String(categoryId || '').trim(),
          available: item?.available,
          variations: item?.variations || [],
          addOns: item?.addOns || [],
          isBestSeller: item?.isBestSeller ?? false,
          subtitle: item?.subtitle,
          shortDescription: item?.shortDescription,
        };
      };

      // Process menu data
      let menuByCategory = {};
      if (menuByCategoryIdFromApi) {
        Object.entries(menuByCategoryIdFromApi).forEach(([categoryId, categoryData]) => {
          const id = String(categoryId).trim();
          const items = Array.isArray(categoryData?.items) ? categoryData.items : [];
          menuByCategory[id] = items.map((item, index) =>
            mapMenuItem(item, index, id)
          );
        });
      } else if (menuMap) {
        Object.entries(menuMap).forEach(([categoryName, items]) => {
          const matchingCategory = categoriesWithIds.find(c => c.name === categoryName);
          const id = matchingCategory?.id || categoryName;
          menuByCategory[id] = (Array.isArray(items) ? items : []).map((item, index) =>
            mapMenuItem(item, index, id)
          );
        });
      } else if (Array.isArray(products)) {
        products.forEach((item, index) => {
          const categoryId = String(item?.categoryId || item?.category?._id || '').trim();
          const resolvedCategoryId = categoryId || 'uncategorized';
          if (!menuByCategory[resolvedCategoryId]) {
            menuByCategory[resolvedCategoryId] = [];
          }
          menuByCategory[resolvedCategoryId].push(
            mapMenuItem(item, index, resolvedCategoryId)
          );
        });
      }

      // Add "All" category at the beginning
      const allCategoriesWithAll = [
        { id: 'all', name: 'All' },
        ...categoriesWithIds,
      ];

      const primaryCategory = 'all';
      const primaryCategoryName = 'All Items';

      // Create menu with "All" category containing all items
      const allItemsList = Object.values(menuByCategory).flat();
      const menu = [
        {
          id: 'all',
          category: 'All Items',
          items: allItemsList,
        },
        ...categoriesWithIds.map(cat => ({
          id: cat.id,
          category: cat.name,
          items: menuByCategory[cat.id] || [],
        })),
      ];

      setRestaurant(prev => {
        const sourceRestaurant = restaurantPayload || initialParamRestaurant || {};
        const name = typeof sourceRestaurant?.name === 'object'
          ? sourceRestaurant?.name?.en ?? prev.name
          : sourceRestaurant?.name ?? prev.name;
        const cuisines = Array.isArray(sourceRestaurant?.cuisine)
          ? sourceRestaurant.cuisine
          : (Array.isArray(sourceRestaurant?.cuisines) ? sourceRestaurant.cuisines : prev.cuisines);

        const nextRestaurant = {
          ...prev,
          id: restaurantParamId,
          name,
          image: sourceRestaurant?.image ?? prev.image,
          bannerImage: sourceRestaurant?.bannerImage ?? prev.bannerImage,
          cuisines,
          ratingAverage: typeof sourceRestaurant?.rating?.average === 'number'
            ? sourceRestaurant.rating.average
            : typeof sourceRestaurant?.rating === 'number'
              ? sourceRestaurant.rating
              : prev.ratingAverage,
          ratingCount: typeof sourceRestaurant?.rating?.count === 'number'
            ? sourceRestaurant.rating.count
            : sourceRestaurant?.ratingCount ?? prev.ratingCount,
          deliveryTime: sourceRestaurant?.deliveryTime ?? prev.deliveryTime,
          minOrderValue: sourceRestaurant?.minOrderValue ?? prev.minOrderValue,
          isFreeDelivery: sourceRestaurant?.isFreeDelivery ?? prev.isFreeDelivery,
          freeDeliveryText: sourceRestaurant?.isFreeDelivery
            ? 'Free delivery'
            : prev.freeDeliveryText,
          minOrder: typeof sourceRestaurant?.minOrderValue === 'number'
            ? `₹${sourceRestaurant.minOrderValue}`
            : prev.minOrder,
          categories: allCategoriesWithAll,
          popularItems: allItemsList,
          menu:
            menu.length > 0
              ? menu
              : [{ id: 'default', category: primaryCategoryName, items: allItemsList }],
          offers: prev.offers || [],
        };

        restaurantMenuCache.set(restaurantParamId, {
          version: MENU_CACHE_VERSION,
          restaurant: nextRestaurant,
          activeCategory: primaryCategory,
        });
        
        return nextRestaurant;
      });
      
      // Set active category to 'all' to trigger re-render
      setActiveCategory(primaryCategory);
    } catch (err) {
      if (isMountedRef.current) {
        setMenuError(err?.message || 'Failed to load menu.');
      }
    } finally {
      if (isMountedRef.current) {
        setMenuLoading(false);
      }
    }
  }, [restaurantParamId, initialParamRestaurant]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchMenu();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchMenu]);

  const { cart, cartCount, totals, addToCart, incrementItem, decrementItem } =
    useContext(CartContext);

  const { isFavourite, toggleFavourite } = useContext(FavouritesContext);

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    let items = [];
    
    // Get items based on active category
    if (!activeCategory || activeCategory === 'all') {
      const allMenu = restaurant.menu?.find(m => m.id === 'all');
      items = allMenu?.items || restaurant.popularItems || [];
    } else {
      const activeKey = String(activeCategory).trim();
      const categoryMenu = restaurant.menu?.find(m => String(m.id || '').trim() === activeKey);
      items = categoryMenu?.items || [];
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item => {
        const name = (item?.name || '').toLowerCase();
        const description = (item?.description || '').toLowerCase();
        const subtitle = (item?.subtitle || '').toLowerCase();
        return name.includes(query) || description.includes(query) || subtitle.includes(query);
      });
    }

    return items;
  }, [activeCategory, searchQuery, restaurant]);

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
  const headerImageSource = (restaurant?.bannerImage && restaurant.bannerImage.trim())
    ? { uri: restaurant.bannerImage }
    : require('../../assets/images/Food.png');
  const thumbImageSource = (restaurant?.image && restaurant.image.trim())
    ? { uri: restaurant.image }
    : require('../../assets/images/Food.png');

  const subtotal = useMemo(() => toNumber(totals?.subtotal, 0), [totals]);

  const getCartLineForItem = item => {
    const menuItemId = item?.id ?? null;
    if (!menuItemId) return null;
    return (Array.isArray(cart) ? cart : []).find(ci =>
      String(ci.menuItemId ?? ci.productId ?? '') === String(menuItemId) &&
      String(ci.restaurantId ?? '') === String(restaurantId),
    );
  };

  const getSimpleQty = item => {
    const line = getCartLineForItem(item);
    return toNumber(line?.quantity, 0);
  };

  const getCartLineIdForItem = item => {
    const line = getCartLineForItem(item);
    return line?.id ?? null;
  };

  const getFavouriteId = item =>
    buildCartLineId({
      restaurantId,
      menuItemId: item?.id ?? null,
      selectedFlavorId: null,
      addOnIds: [],
    });

  const quickAdd = (item) => {
    // Instead of calling API directly, open the drawer for customization
    openDrawer(item);
  };

  const handleToggleFavourite = (item, e) => {
    e?.stopPropagation?.();
    const favId = getFavouriteId(item);
    
    toggleFavourite?.({
      id: favId,
      menuItemId: item?.id,
      name: item?.name,
      image: item?.image,
      description: item?.description,
      price: toNumber(item?.price, 0),
      basePrice: toNumber(item?.price, 0),
      restaurantId,
      restaurantName,
      type: 'product',
    });
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
            source={headerImageSource}
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
                  id: restaurantId,
                  restaurantId: restaurantId,
                  name: restaurantName,
                  image: restaurant.bannerImage || restaurant.image,
                  restaurantName: restaurantName,
                  type: 'restaurant',
                })}
              >
                <Heart
                  size={18}
                  color={isFavourite?.(restaurantId, 'restaurant') ? '#FF3D3D' : '#000'}
                  fill={isFavourite?.(restaurantId, 'restaurant') ? '#FF3D3D' : 'transparent'}
                />
              </Pressable>

            </View>
            {/* <View style={styles.headerIcon}>
              <MoreVertical size={18} color="#000" />
            </View> */}
          </View>

          {/* Rating pill */}
          {restaurant.ratingCount > 0 ? (
            <View style={styles.ratingBadge}>
              <Star size={14} color="#FFB800" fill="#FFB800" />
              <Text style={styles.ratingText}>
                {typeof restaurant.ratingAverage === 'number' 
                  ? restaurant.ratingAverage.toFixed(1) 
                  : '0.0'}
              </Text>
              <Text style={styles.ratingSubText}>
                ({restaurant.ratingCount})
              </Text>
            </View>
          ) : (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>New</Text>
            </View>
          )}
        </View>

        {/* ===== INFO ===== */}
        <View style={styles.infoBox}>
          <View style={styles.topRow}>
            <Image
              source={thumbImageSource}
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
            {/* <TouchableOpacity style={styles.changeBtn} activeOpacity={0.9}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity> */}
          </View>
        </View>

        {/* ===== SEARCH ===== */}
        <View style={styles.searchBox}>
          <Search size={18} color="#9AA0A6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Dish Name...."
            placeholderTextColor="#9AA0A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ===== CATEGORIES ===== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catRow}
        >
          {(restaurant.categories || []).map(cat => (
            <TouchableOpacity key={cat.id} onPress={() => setActiveCategory(cat.id)}>
              <View
                style={[
                  styles.catPill,
                  activeCategory === cat.id && styles.catPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.catText,
                    activeCategory === cat.id && styles.catTextActive,
                  ]}
                >
                  {cat.name || cat}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ===== ITEMS ===== */}
        <View style={styles.itemsCardWrap}>
          <View style={styles.itemsHeader}>
            <Text style={styles.itemsTitle}>
              {activeCategory === 'all'
                ? 'All Items'
                : restaurant.menu?.find(m => m.id === activeCategory)?.category || 'Menu'}
            </Text>
            <Text style={styles.itemsSubTitle}>Most Order right now</Text>
          </View>

          {menuLoading && (
            <Text style={styles.loadingText}>Loading menu...</Text>
          )}

          {!menuLoading && menuError && (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>{menuError}</Text>
              <Pressable style={styles.retryBtn} onPress={fetchMenu}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {!menuLoading && !menuError &&
            (Array.isArray(filteredItems) ? filteredItems : []).map(
              (item, index, arr) => {
                const qty = getSimpleQty(item);
                const favOn = isFavourite?.(item?.id, 'product');
                const itemSubtitle =
                  item?.subtitle ||
                  item?.shortDescription ||
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
                                onPress={(e) => {
                                  e.stopPropagation();
                                  const cartLineId = getCartLineIdForItem(item);
                                  if (cartLineId) {
                                    decrementItem?.(cartLineId);
                                  }
                                }}
                              >
                                <Minus size={12} color="#111" />
                              </Pressable>
                              <Text style={styles.stepQty}>{qty}</Text>
                              <Pressable
                                style={styles.stepBtn}
                                hitSlop={10}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  const cartLineId = getCartLineIdForItem(item);
                                  if (cartLineId) {
                                    incrementItem?.(cartLineId);
                                  } else {
                                    quickAdd(item);
                                  }
                                }}
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
                          onPress={(e) => {
                            e.stopPropagation();
                            quickAdd(item);
                          }}
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

          {!menuLoading && !menuError &&
            (Array.isArray(filteredItems) ? filteredItems : []).length === 0 && (
              <Text style={styles.emptyText}>No items available.</Text>
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
                      color={index < (typeof r?.rating === 'number'
                        ? r.rating
                        : (r?.rating?.average ?? 4)) ? '#FF8A00' : '#F2D2B6'}
                      fill={index < (typeof r?.rating === 'number'
                        ? r.rating
                        : (r?.rating?.average ?? 4)) ? '#FF8A00' : 'transparent'}
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

      {selectedItem && (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    position: 'relative',
  },

  cover: {
    width: '100%',
      height: hp(27),
  },

  headerTopShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
      height: hp(15),
  },

  headerBottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
      height: hp(15),
  },

  back: {
    position: 'absolute',
      top: scale(8),
      left: SPACING.lg,
    backgroundColor: '#FFF',
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  topIcons: {
    position: 'absolute',
      top: scale(8),
      right: SPACING.lg,
    flexDirection: 'row',
      gap: SPACING.md,
  },

  iconCircle: {
      width: scale(36),
      height: scale(36),
    backgroundColor: '#FFF',
      borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  headerBadgeRow: {
    position: 'absolute',
      left: SPACING.lg,
      right: SPACING.lg,
      bottom: scale(10),
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
      paddingHorizontal: SPACING.md,
      paddingVertical: scale(6),
      borderRadius: scale(16),
      gap: SPACING.sm,
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
      fontSize: FONT_SIZES.sm,
  },

  ratingPillSub: {
    color: '#6E6E6E',
    fontWeight: '700',
      fontSize: FONT_SIZES.xs,
  },

  infoBox: {
      padding: SPACING.lg,
      marginTop: scale(-28),
    backgroundColor: '#FFF',
      borderTopLeftRadius: scale(28),
      borderTopRightRadius: scale(28),
  },

  topRow: {
    flexDirection: 'row',
      gap: SPACING.md,
  },

  resThumb: {
      width: scale(86),
      height: scale(96),
      borderRadius: scale(16),
    borderWidth: 3,
    borderColor: '#FFFFFF',
      top: scale(-45),
  },

  name: {
      fontSize: FONT_SIZES.xl,
    fontWeight: '700',
      marginTop: SPACING.xs,
  },

  meta: {
    color: '#7A7A7A',
      marginTop: SPACING.xs,
      fontSize: FONT_SIZES.xs,
  },

  deliveryRow: {
      marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },

  deliveryText: {
      fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#111',
  },

  freeDeliveryText: {
      marginTop: SPACING.xs,
      fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#FF3D3D',
  },

  minOrderText: {
      marginTop: SPACING.xs,
      fontSize: FONT_SIZES.xs,
    color: '#7A7A7A',
    fontWeight: '600',
  },

  changeBtn: {
     marginLeft: SPACING.md,
     paddingHorizontal: SPACING.md,
     paddingVertical: scale(6),
     borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#FFFFFF',
  },

  changeText: {
     fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#555',
  },

  searchBox: {
     margin: SPACING.lg,
    backgroundColor: '#F2F4F7',
     borderRadius: scale(14),
     paddingVertical: SPACING.md,
     paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
     gap: SPACING.sm,
  },

  searchPlaceholder: {
    color: '#9AA0A6',
     fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  searchInput: {
    flex: 1,
    color: '#111',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    paddingVertical: 0,
  },

  catRow: {
     paddingLeft: SPACING.lg,
     marginBottom: SPACING.sm,
  },

  catPill: {
     marginRight: SPACING.sm,
     paddingHorizontal: SPACING.md,
     paddingVertical: scale(9),
     borderRadius: scale(18),
    backgroundColor: '#F2F4F7',
  },

  catPillActive: {
    backgroundColor: '#FF3D3D',
  },

  catText: {
    color: '#6F6F6F',
    fontWeight: '800',
     fontSize: FONT_SIZES.xs,
  },

  catTextActive: {
    color: '#FFF',
  },

  itemsHeader: {
     marginHorizontal: SPACING.md,
     marginTop: SPACING.sm,
     marginBottom: SPACING.sm,
  },

  itemsTitle: {
     fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: '#111',
  },

  itemsSubTitle: {
     marginTop: scale(2),
     fontSize: FONT_SIZES.xs,
    color: '#7A7A7A',
    fontWeight: '600',
  },

  itemsCardWrap: {
     marginHorizontal: SPACING.lg,
     borderRadius: scale(12),
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
     paddingBottom: SPACING.sm,
  },

  itemRow: {
    flexDirection: 'row',
     paddingHorizontal: SPACING.md,
     paddingVertical: SPACING.sm,
    alignItems: 'center',
  },

  itemDivider: {
    height: 1,
    backgroundColor: '#EDEDED',
     marginHorizontal: SPACING.md,
     marginVertical: SPACING.sm,
  },

  itemImgWrap: {
    position: 'relative',
     marginRight: SPACING.sm,
  },

  itemFavBtn: {
    position: 'absolute',
     top: scale(-4),
     left: scale(-4),
     width: scale(24),
     height: scale(24),
     borderRadius: scale(12),
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  itemImg: {
     width: scale(64),
     height: scale(64),
     borderRadius: scale(12),
  },

  itemContent: {
    flex: 1,
  },

  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
      gap: SPACING.sm,
  },

  itemName: {
      fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },

  itemPrice: {
      fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: '#111',
      marginBottom: scale(2),
  },

  itemSubtitle: {
      marginTop: scale(1),
      fontSize: FONT_SIZES.xs,
    color: '#222',
    fontWeight: '600',
  },

  desc: {
      fontSize: FONT_SIZES.xs,
    color: '#777',
      marginTop: scale(2),
  },

  bestSeller: {
    color: '#D84C4C',
     fontSize: FONT_SIZES.xs,
     marginTop: SPACING.xs,
    fontWeight: '700',
    backgroundColor: '#FFE8E8',
     paddingHorizontal: SPACING.sm,
     paddingVertical: scale(3),
     borderRadius: scale(10),
    alignSelf: 'flex-start',
  },

  addPlusBtn: {
    position: 'absolute',
     right: SPACING.md,
     top: SPACING.lg,
     width: scale(24),
     height: scale(24),
     borderRadius: scale(5),
    backgroundColor: '#E6E6E6',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },

  addedRow: {
     marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
     paddingRight: scale(40),
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
     borderRadius: scale(12),
     paddingHorizontal: SPACING.sm,
     height: scale(24),
    backgroundColor: '#FFF',
  },

  stepBtn: {
     width: scale(22),
     height: scale(22),
     borderRadius: scale(11),
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepQty: {
     minWidth: scale(16),
    textAlign: 'center',
    fontWeight: '900',
    color: '#111',
     fontSize: FONT_SIZES.xs,
     marginHorizontal: scale(2),
  },

  cartBar: {
    position: 'absolute',
     left: SPACING.md,
     right: SPACING.md,
     bottom: SPACING.md,
    backgroundColor: '#111',
     borderRadius: scale(16),
     paddingVertical: SPACING.md,
     paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cartBarTitle: {
    color: '#FFF',
    fontWeight: '900',
     fontSize: FONT_SIZES.sm,
  },

  cartBarSub: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
     fontSize: FONT_SIZES.xs,
     marginTop: scale(2),
  },

  cartBtn: {
    backgroundColor: '#FF3D3D',
     paddingVertical: SPACING.sm,
     paddingHorizontal: SPACING.md,
     borderRadius: scale(12),
  },

  cartBtnText: {
    color: '#FFF',
    fontWeight: '900',
     fontSize: FONT_SIZES.xs,
  },

  reviewTitle: {
     margin: SPACING.lg,
     fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },

  reviewList: {
     paddingLeft: SPACING.lg,
     paddingRight: SPACING.sm,
     paddingBottom: SPACING.sm,
  },

  reviewCard: {
     width: wp(80),
    backgroundColor: '#FFFDF5',
     marginRight: SPACING.md,
     padding: SPACING.md,
     borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#F3A15C',
  },

  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
     gap: SPACING.sm,
  },

  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
     gap: scale(2),
  },

  reviewUser: {
    fontWeight: '700',
     fontSize: FONT_SIZES.sm,
    color: '#111',
  },

  reviewText: {
     marginTop: SPACING.md,
    color: '#222',
     fontSize: FONT_SIZES.xs,
     lineHeight: scale(16),
  },

  reviewTime: {
    marginLeft: 'auto',
     fontSize: FONT_SIZES.xs,
    color: '#8E8E93',
    fontWeight: '600',
  },
  headerContainer: {
    position: 'relative',
  },

  headerImage: {
    width: '100%',
      height: hp(29),
  },

  headerIconLeft: {
    position: 'absolute',
      top: scale(24),
      left: SPACING.lg,
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  headerIconRightGroup: {
    position: 'absolute',
      top: scale(24),
      right: SPACING.lg,
    flexDirection: 'row',
      gap: SPACING.md,
  },

  headerIcon: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  ratingBadge: {
    position: 'absolute',
      bottom: scale(35),
      right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
      paddingHorizontal: SPACING.md,
      paddingVertical: scale(7),
      borderRadius: scale(18),
    elevation: 4,
  },

  ratingText: {
      marginLeft: SPACING.sm,
    fontWeight: '800',
      fontSize: FONT_SIZES.sm,
    color: '#000',
  },

  ratingSubText: {
      marginLeft: SPACING.xs,
      fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#666',
  },

  loadingText: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
    color: '#7A7A7A',
      fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },

  errorWrap: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
  },

  errorText: {
    color: '#D84C4C',
      fontSize: FONT_SIZES.xs,
    fontWeight: '700',
      marginBottom: SPACING.sm,
  },

  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF3D3D',
      paddingHorizontal: SPACING.md,
      paddingVertical: scale(6),
      borderRadius: scale(12),
  },

  retryText: {
    color: '#FFF',
      fontSize: FONT_SIZES.xs,
    fontWeight: '800',
  },

  emptyText: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
    color: '#7A7A7A',
      fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
});





