import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';
import { getHomeData } from '../../services/homeService';
import Geolocation from '@react-native-community/geolocation';
import { CartContext } from '../../context/CartContext';
import { FavouritesContext } from '../../context/FavouritesContext';
import FilterDrawer from '../../components/FilterDrawer';
import Offers from './Offers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
import { getRatingAverage, getRatingCount } from '../../utils/ratingUtils';
import { HomeHeader } from '../../components/Home/HomeHeader';
import { FoodCategoryList } from '../../components/Home/FoodCategoryList';
import { PromoCardList } from '../../components/Home/PromoCardList';
import { RestaurantListCard, RestaurantRecommendCard } from '../../components/Home/RestaurantCard';
import { SkeletonCard, SkeletonRecommendCard } from '../../components/Home/SkeletonLoaders';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 360;
  const [restaurants, setRestaurants] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
  const [banners, setBanners] = useState([]);
  const [tabs, setTabs] = useState(['Restaurants', 'Offers']);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [activeTab, setActiveTab] = useState('Restaurants');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [pageNum, setPageNum] = useState(0);
  const itemsPerPage = 8;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('loading address...');
  const [userData, setUserData] = useState(null);
  const { cartCount } = useContext(CartContext);
  const { isFavourite, toggleFavourite } = useContext(FavouritesContext);

  // Memoize map restaurant function to avoid recreating on every render
  const mapRestaurant = useCallback((item) => ({
    ...item,
    id: item._id || item.id,
    name: item.name?.en || item.name || 'Restaurant',
    cuisines: item.cuisine || [],
    image: item.image || '',
    bannerImage: item.bannerImage || '',
    coverImage:
      item.bannerImage ||
      item.image ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    ratingAverage: getRatingAverage(item),
    ratingCount: getRatingCount(item),
    deliveryTime: item.deliveryTime
      ? `${item.deliveryTime} mins`
      : '30 - 40 mins',
    distance:
      item.distanceKm && hasLocationPermission
        ? `${item.distanceKm.toFixed(1)} km`
        : undefined,
    isOpen: item.isActive === true && item.isTemporarilyClosed !== true,
    bestSeller: item.bestSeller || 'Best Seller',
  }), [hasLocationPermission]);

  // Request location permission with proper dialog
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'NewWasseny needs access to your location to show nearby restaurants and accurate delivery times',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow',
          },
        );
        console.log('Permission result:', granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    }

    console.log('iOS: Permission dialog will be triggered on location request');
    return true;
  }, []);

  // Get current location with timeout
  const getCurrentLocation = useCallback(async () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Location request timed out'));
      }, 5000);

      Geolocation.getCurrentPosition(
        position => {
          clearTimeout(timeout);
          console.log('Location obtained:', position.coords);
          resolve({
            lat: position.coords.latitude,
            long: position.coords.longitude,
          });
        },
        error => {
          clearTimeout(timeout);
          console.warn(
            'Geolocation error code:',
            error.code,
            'message:',
            error.message,
          );
          reject(error);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 },
      );
    });
  }, []);

  // Process home data and update state
  const processHomeData = useCallback((data) => {
    // Set categories from API
    if (data?.categories && Array.isArray(data.categories)) {
      const formattedCategories = data.categories.map(cat => ({
        id: cat._id || cat.id,
        name: cat.name,
        title: cat.name,
        image: cat.image
          ? { uri: cat.image }
          : require('../../assets/images/Food.png'),
      }));
      setCategories(formattedCategories);
      setIsLoadingCategories(false);
    }

    // Set banners
    if (data?.banners && Array.isArray(data.banners)) {
      setBanners(data.banners.filter(b => b?.isActive !== false));
    }

    
    if (data?.tabs && Array.isArray(data.tabs)) {
      const filteredTabs = data.tabs.filter(tab => tab !== 'Pick-up');
      setTabs(filteredTabs);
      if (filteredTabs.length > 0) {
        setActiveTab(filteredTabs[0]);
      }
    }

  
    if (data?.sections) {
     
      let recommendedData = (data.sections.recommendedForYou || []).map(mapRestaurant);
      
      // Fallback: if no recommendations, use popular or recent restaurants
      if (recommendedData.length === 0) {
        const fallbackSource = [
          ...(data.sections.popularRestaurants || []),
          ...(data.sections.recentRestaurants || []),
          ...(data.sections.exploreRestaurants || []).slice(0, 5),
        ];
        
        // Remove duplicates and limit to 5
        const uniqueFallback = Array.from(
          new Map(fallbackSource.map(r => [r._id || r.id, r])).values(),
        ).slice(0, 5);
        
        recommendedData = uniqueFallback.map(mapRestaurant);
        console.log('📌 Using fallback recommendations:', recommendedData.length);
      }
      
      setRecommendedRestaurants(recommendedData);

     
      const allRestaurants_raw = [
        ...(data.sections.exploreRestaurants || []),
        ...(data.sections.popularRestaurants || []),
        ...(data.sections.fastDelivery || []),
        ...(data.sections.freeDelivery || []),
        ...(data.sections.newOnPlatform || []),
        ...(data.sections.recentRestaurants || []),
      ];

      // Remove duplicates
      const uniqueRestaurants = Array.from(
        new Map(allRestaurants_raw.map(r => [r._id || r.id, r])).values(),
      );

      const mapped = uniqueRestaurants.map(mapRestaurant);

      setAllRestaurants(mapped);
      setRestaurants(mapped.slice(0, itemsPerPage));
      
      console.log('🍽️ Restaurants loaded:', {
        recommended: recommendedData.length,
        explore: mapped.length,
        sections: {
          recommendedForYou: data.sections.recommendedForYou?.length || 0,
          popularRestaurants: data.sections.popularRestaurants?.length || 0,
          exploreRestaurants: data.sections.exploreRestaurants?.length || 0,
        }
      });
    }
  }, [mapRestaurant]);

  // Fetch home data
  const fetchHomeData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoadingRestaurants(true);
        setPageNum(0);
      }

      // Start location request in background (non-blocking)
      const locationPromise = (async () => {
        try {
          const hasPermission = await requestLocationPermission();
          setHasLocationPermission(hasPermission);
          if (hasPermission) {
            const currentLocation = await getCurrentLocation();
            setUserLocation(currentLocation);
            return currentLocation;
          }
        } catch (err) {
          console.warn(
            'Location error handled gracefully, continuing without location',
          );
        }
        return null;
      })();

    
      let data = null;
      let loc = null;
      
      try {
        
        loc = await locationPromise;
      } catch (err) {
        console.warn('Location unavailable, fetching without location');
      }
      
      try {
        console.log('🔄 Fetching home data from API...');
        const startTime = Date.now();
        
        
        const params = {}; 
        console.log('⚠️ Location filter disabled - showing all restaurants');
        console.log('📍 User location:', loc);
        
        data = await getHomeData(params);
        
        const loadTime = Date.now() - startTime;
        console.log(`✅ API response received in ${loadTime}ms`);
        console.log('📦 Data structure:', {
          banners: data?.banners?.length || 0,
          categories: data?.categories?.length || 0,
          hasSections: !!data?.sections,
          recommendedForYou: data?.sections?.recommendedForYou?.length || 0,
          exploreRestaurants: data?.sections?.exploreRestaurants?.length || 0,
          popularRestaurants: data?.sections?.popularRestaurants?.length || 0,
          fastDelivery: data?.sections?.fastDelivery?.length || 0,
          freeDelivery: data?.sections?.freeDelivery?.length || 0,
          newOnPlatform: data?.sections?.newOnPlatform?.length || 0,
          recentRestaurants: data?.sections?.recentRestaurants?.length || 0,
        });
      } catch (apiError) {
        console.warn('API fetch failed:', apiError.message);
        
        // Handle 401 - User needs to log in
        if (apiError?.response?.status === 401) {
          console.error(' [HomePage] Authentication required for home data');
          Toast.show({
            type: 'topError',
            text1: 'Authentication Required',
            text2: 'Please log in to view restaurants',
            position: 'top',
          });
        } else {
          // Handle other errors
          Toast.show({
            type: 'topError',
            text1: 'Connection Issue',
            text2: 'Unable to connect. Please check your internet and try again.',
            position: 'top',
          });
        }
        
        // Use fallback/demo data if API fails
        data = {
          banners: [],
          categories: [],
          tabs: ['Restaurants', 'Offers', 'Pick-up'],
          sections: {
            recentRestaurants: [],
            recommendedForYou: [],
            exploreRestaurants: [],
            popularRestaurants: [],
            fastDelivery: [],
            freeDelivery: [],
            newOnPlatform: [],
          },
          metadata: {},
        };
      }

      if (loc) {
        setUserLocation(loc);
      }
      processHomeData(data);
    } catch (error) {
      console.error('Error fetching home data:', error);
     
      Toast.show({
        type: 'topError',
        text1: 'Connection Issue',
        text2: 'Unable to connect. Please check your internet and try again.',
        position: 'top',
      });
      setRestaurants([]);
    } finally {
      if (showLoading) {
        setIsLoadingRestaurants(false);
      }
    }
  }, [requestLocationPermission, getCurrentLocation, processHomeData]);

  // Fetch user address and profile data
  const fetchUserData = useCallback(async () => {
    try {
      const response = await apiClient.get(USER_ROUTES.profile);
      const user = response?.data?.user || response?.data;

      
      setUserData(user);

      
      if (user?.savedAddresses && user.savedAddresses.length > 0) {
        
        const defaultAddress = user.savedAddresses.find(
          addr => addr.isDefault === true,
        );

        if (defaultAddress) {
          setAddressLabel(defaultAddress.label);
          setAddressLine(defaultAddress.addressLine);
        } else {
          // If no default, use the first address
          const firstAddress = user.savedAddresses[0];
          setAddressLabel(firstAddress.label);
          setAddressLine(firstAddress.addressLine);
        }
      }
    } catch (error) {
      console.warn('Error fetching user data:', error);
      // Fallback to default address kept as is
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
    fetchUserData();
  }, [fetchHomeData, fetchUserData]);

  // Load more restaurants when user scrolls
  const loadMoreRestaurants = useCallback(() => {
    if (pageNum * itemsPerPage < allRestaurants.length) {
      const nextPage = pageNum + 1;
      const startIndex = nextPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setRestaurants([
        ...restaurants,
        ...allRestaurants.slice(startIndex, endIndex),
      ]);
      setPageNum(nextPage);
    }
  }, [pageNum, allRestaurants, restaurants]);

  // Toggle favorite function with proper restaurant data
  const handleToggleFavorite = useCallback((restaurant) => {
    if (!restaurant) return;

    toggleFavourite?.({
      id: restaurant.id || restaurant._id,
      restaurantId: restaurant.id || restaurant._id,
      name: restaurant.name,
      image: restaurant.bannerImage || restaurant.image,
      restaurantName: restaurant.name,
      type: 'restaurant',
    });
  }, [toggleFavourite]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reset page to load fresh data
      setPageNum(0);
      // Reload all data
      await Promise.all([
        fetchHomeData(false), // false to avoid showing loading skeleton
        fetchUserData() // Reload user address as well
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchHomeData, fetchUserData]);

  const promoImageSource = useMemo(() =>
    restaurants?.[0]?.bannerImage != null
      ? { uri: restaurants[0].bannerImage }
      : require('../../assets/images/Food.png'),
  [restaurants]);

  // Build promo cards from API banners or fall back to restaurants
  const promoCards = useMemo(() =>
    banners.length > 0
      ? banners.map(banner => {
          const bannerImage = (banner?.image || '').trim();
          const isDataUri = bannerImage.startsWith('data:image');
          const isHttp =
            bannerImage.startsWith('http://') ||
            bannerImage.startsWith('https://');
          const isRelativePath = bannerImage.startsWith('/');
          const looksLikeBase64 =
            !isDataUri &&
            !isHttp &&
            !isRelativePath &&
            bannerImage.length > 200;

          const bannerUri = isDataUri
            ? bannerImage
            : isHttp
            ? bannerImage
            : looksLikeBase64
            ? `data:image/jpeg;base64,${bannerImage}`
            : `${apiClient.defaults.baseURL}${bannerImage}`;

          return {
            id: banner._id,
            image: bannerImage ? { uri: bannerUri } : promoImageSource,
            title: banner.title || 'Seasonal favorites are here',
            subtitle: 'try something new today !',
            cta: 'Explore Now',
            banner: banner,
          };
        })
      : Array.isArray(restaurants) && restaurants.length
      ? restaurants.slice(0, 6).map(r => ({
          id: String(r.id ?? r.name),
          image:
            r?.bannerImage && r.bannerImage.trim()
              ? { uri: r.bannerImage }
              : promoImageSource,
          title: 'Seasonal favorites are here',
          subtitle: 'try something new today !',
          cta: 'Explore Now',
          restaurant: r,
        }))
      : [], [banners, restaurants, promoImageSource]);

  // Memoized handlers for navigation
  const handleProfilePress = useCallback(() => {
    const tabNav = navigation.getParent?.();
    if (tabNav?.navigate) {
      tabNav.navigate('Profile', {
        screen: 'ProfileHome',
      });
    }
  }, [navigation]);

  const handleCartPress = useCallback(() => {
    navigation.navigate('Cart');
  }, [navigation]);

  const handleNotificationPress = useCallback(() => {
    navigation.navigate('NotificationSettings');
  }, [navigation]);

  const handleSearchPress = useCallback(() => {
    const tabNav = navigation.getParent?.();
    if (tabNav?.navigate) {
      tabNav.navigate('Search', {
        screen: 'SearchHome',
        params: { autoFocus: true },
      });
    } else {
      navigation.navigate('SearchHome', {
        autoFocus: true,
      });
    }
  }, [navigation]);

  const handleCategoryPress = useCallback((item) => {
    const tabNav = navigation.getParent?.();
    if (tabNav?.navigate) {
      tabNav.navigate('Search', {
        screen: 'SearchHome',
        params: {
          autoFocus: true,
          category: item.name,
          initialQuery: item.name,
        },
      });
    } else {
      navigation.navigate('SearchHome', {
        autoFocus: true,
        category: item.name,
        initialQuery: item.name,
      });
    }
  }, [navigation]);

  const handlePromoPress = useCallback((item) => {
    if (item.restaurant) {
      navigation.navigate('RestaurantDetail', {
        restaurant: item.restaurant,
      });
    }
  }, [navigation]);

  const handleRestaurantPress = useCallback((item) => {
    navigation.navigate('RestaurantDetail', {
      restaurant: item,
    });
  }, [navigation]);

  const handleTabPress = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleTryAgain = useCallback(async () => {
    setIsRefreshing(true);
    await fetchHomeData(true);
    setIsRefreshing(false);
  }, [fetchHomeData]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#ed1c24']}
              tintColor="#ed1c24"
            />
          }
        >
          {/* HEADER + SEARCH + TABS */}
          <HomeHeader
            addressLabel={addressLabel}
            addressLine={addressLine}
            userData={userData}
            cartCount={cartCount}
            tabs={tabs}
            activeTab={activeTab}
            isSmallDevice={isSmallDevice}
            onProfilePress={handleProfilePress}
            onCartPress={handleCartPress}
            onNotificationPress={handleNotificationPress}
            onSearchPress={handleSearchPress}
            onTabPress={handleTabPress}
          />

          {activeTab === 'Offers' ? (
            <Offers />
          ) : (
            <>
              {/* FOOD CATEGORIES */}
              <FoodCategoryList
                categories={categories}
                isLoading={isLoadingCategories}
                onCategoryPress={handleCategoryPress}
              />

              {/* PROMO (X-axis scroll) */}
              <PromoCardList
                promoCards={promoCards}
                onPromoPress={handlePromoPress}
              />

              {/* RECOMMENDED */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended For You</Text>
              </View>

              {isLoadingRestaurants ? (
                <FlatList
                  horizontal
                  data={Array(3).fill(null)}
                  keyExtractor={(_, index) => `skeleton-recommend-${index}`}
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={true}
                  contentContainerStyle={styles.recommendList}
                  renderItem={() => <SkeletonRecommendCard />}
                />
              ) : recommendedRestaurants.length > 0 ? (
                <FlatList
                  horizontal
                  data={recommendedRestaurants}
                  keyExtractor={item => item.id}
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={true}
                  contentContainerStyle={styles.recommendList}
                  renderItem={({ item }) => (
                    <RestaurantRecommendCard
                      item={item}
                      isFavorite={isFavourite?.(item.id, 'restaurant')}
                      onPress={() => handleRestaurantPress(item)}
                      onFavoritePress={() => handleToggleFavorite(item)}
                    />
                  )}
                />
              ) : null}

              {/* EXPLORE */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Explore Restaurants</Text>
                <View style={styles.sortActions}>
                  {/* <TouchableOpacity activeOpacity={0.85} onPress={() => {}}>
                    <Text style={styles.sortText}>Sort</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setIsFilterOpen(true)}
                  >
                    <Text style={styles.sortText}>Filter</Text>
                  </TouchableOpacity> */}
                </View>
              </View>

              {isLoadingRestaurants ? (
                <View style={{ marginBottom: hp(5) }}>
                  <FlatList
                    data={Array(6).fill(null)}
                    keyExtractor={(_, index) => `skeleton-${index}`}
                    scrollEnabled={false}
                    renderItem={() => <SkeletonCard />}
                  />
                  <View
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingVertical: hp(1.5),
                    }}
                  >
                    <ActivityIndicator size="small" color="#ed1c24" />
                    <Text
                      style={{
                        marginTop: hp(1),
                        color: '#8E8E93',
                        fontSize: FONT.xs,
                      }}
                    >
                      Loading restaurants...
                    </Text>
                  </View>
                </View>
              ) : null}

              {isLoadingRestaurants ? (
                <View style={{ marginBottom: hp(5) }}>
                  <FlatList
                    data={Array(6).fill(null)}
                    keyExtractor={(_, index) => `skeleton-${index}`}
                    scrollEnabled={false}
                    renderItem={() => <SkeletonCard />}
                  />
                  <View
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingVertical: hp(1.5),
                    }}
                  >
                    <ActivityIndicator size="small" color="#ed1c24" />
                    <Text
                      style={{
                        marginTop: hp(1),
                        color: '#8E8E93',
                        fontSize: FONT.xs,
                      }}
                    >
                      Loading restaurants...
                    </Text>
                  </View>
                </View>
              ) : restaurants.length > 0 ? (
                <FlatList
                  data={restaurants}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingBottom: hp(8) }}
                  renderItem={({ item }) => (
                    <RestaurantListCard
                      item={item}
                      isFavorite={isFavourite?.(item.id, 'restaurant')}
                      onPress={() => handleRestaurantPress(item)}
                      onFavoritePress={() => handleToggleFavorite(item)}
                    />
                  )}
                  onEndReached={loadMoreRestaurants}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={<View style={{ height: hp(2) }} />}
                />
              ) : (
                <View
                  style={{
                    height: hp(25),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#8E8E93',
                      fontSize: FONT.sm,
                      marginBottom: hp(1.5),
                    }}
                  >
                    No restaurants available
                  </Text>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: wp(5.56),
                      paddingVertical: hp(1.25),
                      backgroundColor: '#ed1c24',
                      borderRadius: scale(8),
                      opacity: isRefreshing ? 0.6 : 1,
                    }}
                    disabled={isRefreshing}
                    onPress={handleTryAgain}
                  >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                      {isRefreshing ? 'Loading...' : 'Try Again'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: hp(5) }} />
            </>
          )}
        </ScrollView>
      </View>
      <FilterDrawer
        visible={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onReset={() => {}}
        onApply={() => {}}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ed1c24',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    marginTop: hp(3.75),
    paddingHorizontal: wp(4.44),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: FONT.md + scale(2),
    fontWeight: '600',
  },
  sortText: {
    fontSize: FONT.md,
    color: '#8E8E93',
    gap: 4,
  },
  sortActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.78),
  },
  recommendList: {
    paddingLeft: wp(4.44),
    marginTop: hp(1.75),
    paddingBottom: hp(2),
  },
});
