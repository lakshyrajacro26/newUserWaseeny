import React, { useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import AddToCartDrawer from '../../components/AddToCartDrawer';
import { CartContext } from '../../context/CartContext';
import { FavouritesContext } from '../../context/FavouritesContext';
import { buildCartLineId, toNumber } from '../../services/cartPricing';
import { getRestaurantMenu } from '../../services/restaurantService';
import { RestaurantHeader } from '../../components/Restaurant/RestaurantHeader';
import { RestaurantInfo } from '../../components/Restaurant/RestaurantInfo';
import { SearchBar, CategoryPills } from '../../components/Restaurant/CategoryAndSearch';
import { MenuItemCard } from '../../components/Restaurant/MenuItemCard';
import { ReviewList } from '../../components/Restaurant/ReviewList';
import { CartBottomBar } from '../../components/Restaurant/CartBottomBar';

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

      const allCategoriesWithAll = [
        { id: 'all', name: 'All' },
        ...categoriesWithIds,
      ];

      const primaryCategory = 'all';
      const primaryCategoryName = 'All Items';

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
    
    if (!activeCategory || activeCategory === 'all') {
      const allMenu = restaurant.menu?.find(m => m.id === 'all');
      items = allMenu?.items || restaurant.popularItems || [];
    } else {
      const activeKey = String(activeCategory).trim();
      const categoryMenu = restaurant.menu?.find(m => String(m.id || '').trim() === activeKey);
      items = categoryMenu?.items || [];
    }

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
        <RestaurantHeader
          headerImage={headerImageSource}
          onBackPress={() => navigation.goBack()}
          isFavorite={isFavourite?.(restaurantId, 'restaurant')}
          onFavoritePress={() => toggleFavourite({
            id: restaurantId,
            restaurantId: restaurantId,
            name: restaurantName,
            image: restaurant.bannerImage || restaurant.image,
            restaurantName: restaurantName,
            type: 'restaurant',
          })}
          ratingAverage={restaurant.ratingAverage}
          ratingCount={restaurant.ratingCount}
        />

        {/* ===== INFO ===== */}
        <RestaurantInfo
          thumbImage={thumbImageSource}
          name={restaurant.name}
          cuisines={restaurant.cuisines}
          deliveryTime={deliveryTimeText}
          freeDeliveryText={freeDeliveryText}
          minOrder={minOrderText}
        />

        {/* ===== SEARCH ===== */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* ===== CATEGORIES ===== */}
        <CategoryPills
          categories={restaurant.categories}
          activeCategory={activeCategory}
          onCategoryPress={setActiveCategory}
        />

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
                const cartLineId = getCartLineIdForItem(item);

                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={qty}
                    isFavorite={favOn}
                    onPress={() => openDrawer(item)}
                    onFavoritePress={(e) => handleToggleFavourite(item, e)}
                    onIncrement={(e) => {
                      e.stopPropagation();
                      if (cartLineId) {
                        incrementItem?.(cartLineId);
                      } else {
                        quickAdd(item);
                      }
                    }}
                    onDecrement={(e) => {
                      e.stopPropagation();
                      if (cartLineId) {
                        decrementItem?.(cartLineId);
                      }
                    }}
                    onQuickAdd={(e) => {
                      e.stopPropagation();
                      quickAdd(item);
                    }}
                    showDivider={index < arr.length - 1}
                  />
                );
              },
            )}

          {!menuLoading && !menuError &&
            (Array.isArray(filteredItems) ? filteredItems : []).length === 0 && (
              <Text style={styles.emptyText}>No items available.</Text>
            )}
        </View>

        {/* ===== REVIEWS ===== */}
        <ReviewList reviews={restaurant.reviews} />
      </ScrollView>

      <CartBottomBar
        cartCount={cartCount}
        subtotal={subtotal}
        onPress={() => navigation.navigate('Cart')}
      />

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





