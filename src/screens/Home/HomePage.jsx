import React, { useContext, useState, useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';
import { getHomeData } from '../../services/homeService';
import Geolocation from '@react-native-community/geolocation';
import {
  Bell,
  Heart,
  MapPin,
  Search,
  ShoppingCart,
  Star,
} from 'lucide-react-native';
import { CartContext } from '../../context/CartContext';
import { FavouritesContext } from '../../context/FavouritesContext';
import FilterDrawer from '../../components/FilterDrawer';
import Offers from './Offers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
const PROMO_CARD_WIDTH = wp(82);
const PROMO_CARD_GAP = wp(3.33);

const getRatingAverage = item => {
  if (typeof item?.rating?.average === 'number') return item.rating.average;
  if (typeof item?.ratingAverage === 'number') return item.ratingAverage;
  if (typeof item?.rating === 'number') return item.rating;
  if (typeof item?.rating?.average === 'string') {
    const avg = Number(item.rating.average);
    return Number.isFinite(avg) ? avg : 0;
  }
  if (typeof item?.rating === 'string') {
    const avg = Number(item.rating);
    return Number.isFinite(avg) ? avg : 0;
  }
  return 0;
};

const getRatingCount = item => {
  if (typeof item?.ratingCount === 'number') return item.ratingCount;
  if (typeof item?.rating?.count === 'number') return item.rating.count;
  if (typeof item?.rating?.count === 'string') {
    const count = Number(item.rating.count);
    return Number.isFinite(count) ? count : 0;
  }
  return item?.ratingCount || 0;
};

const RestaurantListCard = memo(
  ({ item, isFavorite, onPress, onFavoritePress }) => {
    const cuisines = Array.isArray(item?.cuisine)
      ? item.cuisine
      : Array.isArray(item?.cuisines)
      ? item.cuisines
      : [];
    const cuisineText =
      cuisines.length > 0 ? cuisines.join(', ') : 'Pizza, Italian, Fast Food';
    const distanceText = item?.distance || null;
    const timeText = item?.deliveryTime
      ? `${item.deliveryTime} minutes`
      : '20 - 30 minutes';
    const ratingValue = getRatingAverage(item);
    const ratingCount = getRatingCount(item);
    const bestSellerText = item?.bestSeller || 'Popular choice';

    return (
      <TouchableOpacity
        style={styles.listCard}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.listImageWrap}>
          <Image
            source={
              item.bannerImage && item.bannerImage.trim()
                ? { uri: item.bannerImage }
                : require('../../assets/images/Food.png')
            }
            style={styles.listImage}
          />
          <TouchableOpacity
            style={styles.listFavBtn}
            activeOpacity={0.8}
            onPress={onFavoritePress}
          >
            <Heart
              size={16}
              color={isFavorite ? '#ed1c24' : '#111111'}
              fill={isFavorite ? '#ed1c24' : 'none'}
            />
          </TouchableOpacity>
          <View style={styles.listImageDots}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={`list-dot-${index}`}
                style={
                  index === 4
                    ? [styles.listDot, styles.listDotActive]
                    : styles.listDot
                }
              />
            ))}
          </View>
        </View>
        <View style={styles.listBody}>
          <View style={styles.listTitleRow}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.listRatingRow}>
              <Star size={14} color="#F5A623" fill="#F5A623" />
              <Text style={styles.listRatingValue}>{ratingValue}</Text>
              <Text style={styles.listRatingCount}>({ratingCount})</Text>
            </View>
          </View>
          <Text style={styles.listMeta} numberOfLines={1}>
            {cuisineText}
          </Text>
          <Text style={styles.listSubMeta} numberOfLines={1}>
            {distanceText ? `${distanceText} away | ${timeText}` : timeText}
          </Text>
          <View style={styles.listBestSellerPill}>
            <Text style={styles.listBestSellerText} numberOfLines={1}>
              {bestSellerText}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

// Skeleton loader component for restaurant cards (vertical)
const SkeletonCard = memo(() => (
  <View style={styles.listCard}>
    <View style={[styles.listImageWrap, { backgroundColor: '#E8E8E8' }]}>
      <View style={[styles.listImage, { backgroundColor: '#D3D3D3' }]} />
    </View>
    <View style={styles.listBody}>
      <View
        style={{
          height: hp(2),
          backgroundColor: '#E8E8E8',
          borderRadius: scale(4),
          marginBottom: hp(1),
          width: '70%',
        }}
      />
      <View
        style={{
          height: hp(1.5),
          backgroundColor: '#E8E8E8',
          borderRadius: scale(3),
          marginBottom: hp(0.75),
          width: '85%',
        }}
      />
      <View
        style={{
          height: hp(1.5),
          backgroundColor: '#E8E8E8',
          borderRadius: scale(3),
          width: '75%',
        }}
      />
    </View>
  </View>
));

// Skeleton loader component for horizontal recommended cards
const SkeletonRecommendCard = memo(() => (
  <View style={styles.recommendCard}>
    <View style={[styles.recommendImageWrap, { backgroundColor: '#E8E8E8' }]}>
      <View style={[styles.recommendImage, { backgroundColor: '#D3D3D3' }]} />
    </View>
    <View style={styles.recommendBody}>
      <View
        style={{
          height: hp(1.75),
          backgroundColor: '#E8E8E8',
          borderRadius: scale(3),
          marginBottom: hp(0.75),
          width: '70%',
        }}
      />
      <View
        style={{
          height: hp(1.375),
          backgroundColor: '#E8E8E8',
          borderRadius: scale(2),
          marginBottom: hp(0.5),
          width: '85%',
        }}
      />
      <View
        style={{
          height: hp(1.375),
          backgroundColor: '#E8E8E8',
          borderRadius: scale(2),
          width: '75%',
        }}
      />
    </View>
  </View>
));

// Skeleton loader component for food category items
const SkeletonFoodItem = memo(() => (
  <View style={styles.foodItem}>
    <View style={[styles.foodImage, { backgroundColor: '#E8E8E8' }]} />
    <View
      style={{
        height: hp(1.5),
        backgroundColor: '#E8E8E8',
        borderRadius: scale(3),
        marginTop: hp(1),
        width: '80%',
      }}
    />
  </View>
));

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 360;
  const [homeData, setHomeData] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [banners, setBanners] = useState([]);
  const [sections, setSections] = useState({});
  const [tabs, setTabs] = useState(['Restaurants', 'Offers', 'Pick-up']);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [activeTab, setActiveTab] = useState('Restaurants');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [location, setLocation] = useState(null);
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

  // Request location permission with proper dialog
  const requestLocationPermission = async () => {
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
  };

  // Get current location with timeout
  const getCurrentLocation = async () => {
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
  };

  // Fetch home data
  const fetchHomeData = async (showLoading = true) => {
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
            const location = await getCurrentLocation();
            setLocation(location);
            return location;
          }
        } catch (err) {
          console.warn(
            'Location error handled gracefully, continuing without location',
          );
        }
        return null;
      })();

      // Fetch home data WITHOUT timeout (let server respond naturally)
      let data = null;
      try {
        console.log('Fetching home data from API...');
        const startTime = Date.now();
        data = await getHomeData({});
        const loadTime = Date.now() - startTime;
        console.log(`API response received in ${loadTime}ms`);
      } catch (apiError) {
        console.warn('API fetch failed:', apiError.message);
        // Use fallback/demo data if API fails
        data = {
          banners: [],
          tabs: ['Restaurants', 'Offers', 'Pick-up'],
          sections: {
            recentRestaurants: [],
            exploreRestaurants: [],
            popularRestaurants: [],
          },
        };
      }

      setHomeData(data);
      processHomeData(data);

      // Get location and re-fetch if available (non-blocking)
      locationPromise.then(loc => {
        if (loc) {
          getHomeData(loc)
            .then(updatedData => {
              setHomeData(updatedData);
              setLocation(loc);
              processHomeData(updatedData);
            })
            .catch(err => console.warn('Location-based update failed'));
        }
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
      // Show friendly error message
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
  };

  // Process home data and update state
  const processHomeData = data => {
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

    // Set tabs
    if (data?.tabs && Array.isArray(data.tabs)) {
      setTabs(data.tabs);
      if (data.tabs.length > 0) {
        setActiveTab(data.tabs[0]);
      }
    }

    // Set sections and restaurants
    if (data?.sections) {
      setSections(data.sections);

      const allRestaurants_raw = [
        ...(data.sections.recentRestaurants || []),
        ...(data.sections.exploreRestaurants || []),
        ...(data.sections.popularRestaurants || []),
      ];

      // Remove duplicates
      const uniqueRestaurants = Array.from(
        new Map(allRestaurants_raw.map(r => [r._id || r.id, r])).values(),
      );

      const mapped = uniqueRestaurants.map(item => ({
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
      }));

      setAllRestaurants(mapped);
      setRestaurants(mapped.slice(0, itemsPerPage));
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Fetch user address and profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiClient.get(USER_ROUTES.profile);
        const user = response?.data?.user || response?.data;

        // Set user data including profile picture
        setUserData(user);

        // Extract address from savedAddresses array
        if (user?.savedAddresses && user.savedAddresses.length > 0) {
          // First, look for the default address (isDefault: true)
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
    };

    fetchUserData();
  }, []);

  // Load more restaurants when user scrolls
  const loadMoreRestaurants = () => {
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
  };

  // Toggle favorite function with proper restaurant data
  const handleToggleFavorite = restaurant => {
    if (!restaurant) return;

    toggleFavourite?.({
      id: restaurant.id || restaurant._id,
      restaurantId: restaurant.id || restaurant._id,
      name: restaurant.name,
      image: restaurant.bannerImage || restaurant.image,
      restaurantName: restaurant.name,
      type: 'restaurant',
    });
  };

  const promoImageSource =
    restaurants?.[0]?.bannerImage != null
      ? { uri: restaurants[0].bannerImage }
      : require('../../assets/images/Food.png');

  // Build promo cards from API banners or fall back to restaurants
  const promoCards =
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
      : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* <StatusBar hidden /> */}
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* HEADER + SEARCH + TABS */}
          <ImageBackground
            source={require('../../assets/images/BgImagee.png')}
            style={styles.headerBg}
            imageStyle={styles.headerBgImage}
            resizeMode="cover"
          >
            <View style={styles.headerGlass}>
              <View
                style={[
                  styles.headerRow,
                  isSmallDevice && styles.headerRowCompact,
                ]}
              >
                <View style={styles.headerLeft}>
                  <MapPin size={18} color="#111111" />
                  <View style={styles.addressBlock}>
                    <Text style={styles.homeLabel}>{addressLabel}</Text>
                    <Text style={styles.location} numberOfLines={1}>
                      {addressLine}
                    </Text>
                  </View>
                </View>

                <View style={styles.headerRight}>
                  <TouchableOpacity
                    style={styles.avatarRing}
                    activeOpacity={0.85}
                    onPress={() => {
                      const tabNav = navigation.getParent?.();
                      if (tabNav?.navigate) {
                        tabNav.navigate('Profile', {
                          screen: 'ProfileHome',
                        });
                      }
                    }}
                  >
                    <Image
                      source={
                        userData?.profilePic
                          ? { uri: userData.profilePic }
                          : require('../../assets/icons/user.png')
                      }
                      style={styles.avatarImg}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Cart')}
                  >
                    <ShoppingCart size={18} color="#FFFFFF" />
                    {cartCount > 0 ? (
                      <View style={styles.cartBadge} pointerEvents="none">
                        <Text style={styles.cartBadgeText}>
                          {cartCount > 99 ? '99+' : String(cartCount)}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      navigation.navigate('NotificationSettings');
                    }}
                  >
                    <Bell size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.searchBox,
                  isSmallDevice && styles.searchBoxCompact,
                ]}
                activeOpacity={0.9}
                onPress={() => {
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
                }}
              >
                <Search size={18} color="#9E9E9E" />
                <TextInput
                  placeholder="Search Dish name..."
                  placeholderTextColor="#9E9E9E"
                  style={styles.searchInput}
                  editable={false}
                />
              </TouchableOpacity>

              <View style={[styles.tabs, isSmallDevice && styles.tabsCompact]}>
                {tabs.map(label => {
                  const isActive = activeTab === label;
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[
                        styles.tabItem,
                        isSmallDevice && styles.tabItemCompact,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setActiveTab(label)}
                    >
                      <Text
                        style={
                          isActive
                            ? [
                                styles.tabTextActive,
                                isSmallDevice && styles.tabTextCompact,
                              ]
                            : [
                                styles.tabText,
                                isSmallDevice && styles.tabTextCompact,
                              ]
                        }
                      >
                        {label}
                      </Text>
                      {isActive ? <View style={styles.tabUnderline} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ImageBackground>

          {activeTab === 'Offers' ? (
            <Offers />
          ) : (
            <>
              {/* FOOD CATEGORIES */}
              {isLoadingCategories ? (
                <FlatList
                  horizontal
                  data={Array(5).fill(null)}
                  keyExtractor={(_, index) => `skeleton-food-${index}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.foodList}
                  renderItem={() => <SkeletonFoodItem />}
                />
              ) : categories.length > 0 ? (
                <FlatList
                  horizontal
                  data={categories}
                  keyExtractor={item => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.foodList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.foodItem}
                      activeOpacity={0.85}
                      onPress={() => {
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
                      }}
                    >
                      <Image source={item.image} style={styles.foodImage} />
                      <Text style={styles.foodTitle}>{item.title}</Text>
                    </TouchableOpacity>
                  )}
                />
              ) : null}

              {/* PROMO (X-axis scroll) */}
              {promoCards.length > 0 && (
                <FlatList
                  horizontal
                  data={promoCards}
                  keyExtractor={item => item.id}
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled
                  contentContainerStyle={styles.promoList}
                  snapToInterval={Math.round(PROMO_CARD_WIDTH) + PROMO_CARD_GAP}
                  decelerationRate="fast"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.promoCard}
                      onPress={() => {
                        if (item.restaurant) {
                          navigation.navigate('RestaurantDetail', {
                            restaurant: item.restaurant,
                          });
                        }
                      }}
                    >
                      <Image source={item.image} style={styles.promoImage} />
                      <View style={styles.promoShade} />
                      <View style={styles.promoOverlay}>
                        <Text style={styles.promoTitle}>{item.title}</Text>
                        <Text style={styles.promoSub}>{item.subtitle}</Text>
                        <View style={styles.promoBtn}>
                          <Text style={styles.promoBtnText}>{item.cta}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}

              {/* RECOMMENDED */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended For You</Text>
                {/* <Text style={styles.viewAll}>View All</Text> */}
              </View>

              {isLoadingRestaurants ? (
                <FlatList
                  horizontal
                  data={Array(3).fill(null)}
                  keyExtractor={(_, index) => `skeleton-recommend-${index}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendList}
                  renderItem={() => <SkeletonRecommendCard />}
                />
              ) : (
                <FlatList
                  horizontal
                  data={restaurants}
                  keyExtractor={item => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendList}
                  renderItem={({ item }) =>
                    (() => {
                      const cuisines = Array.isArray(item?.cuisine)
                        ? item.cuisine
                        : Array.isArray(item?.cuisines)
                        ? item.cuisines
                        : [];
                      const cuisineText =
                        cuisines.length > 0
                          ? cuisines.join(', ')
                          : 'Pizza, Italian, Fast Food';
                      const distanceText = item?.distance || null;
                      const timeText = item?.deliveryTime
                        ? `${item.deliveryTime} minutes`
                        : '20 - 30 minutes';
                      const ratingValue = getRatingAverage(item);
                      const ratingCount = getRatingCount(item);
                      const bestSellerText =
                        item?.bestSeller || 'Popular choice';
                      const isFavoriteItem = isFavourite?.(
                        item.id,
                        'restaurant',
                      );

                      return (
                        <TouchableOpacity
                          style={styles.recommendCard}
                          onPress={() =>
                            navigation.navigate('RestaurantDetail', {
                              restaurant: item,
                            })
                          }
                        >
                          <View style={styles.recommendImageWrap}>
                            <Image
                              source={
                                item.bannerImage && item.bannerImage.trim()
                                  ? { uri: item.bannerImage }
                                  : require('../../assets/images/Food.png')
                              }
                              style={styles.recommendImage}
                            />
                            <TouchableOpacity
                              style={styles.favBtn}
                              activeOpacity={0.8}
                              onPress={() => handleToggleFavorite(item)}
                            >
                              <Heart
                                size={16}
                                color={isFavoriteItem ? '#ed1c24' : '#111111'}
                                fill={isFavoriteItem ? '#ed1c24' : 'none'}
                              />
                            </TouchableOpacity>
                            <View style={styles.imageDots}>
                              {Array.from({ length: 6 }).map((_, index) => (
                                <View
                                  key={`dot-${index}`}
                                  style={
                                    index === 4
                                      ? [styles.dot, styles.dotActive]
                                      : styles.dot
                                  }
                                />
                              ))}
                            </View>
                          </View>
                          <View style={styles.recommendBody}>
                            <View style={styles.recommendTitleRow}>
                              <Text
                                style={styles.recommendTitle}
                                numberOfLines={1}
                              >
                                {item.name}
                              </Text>
                              <View style={styles.ratingRow}>
                                <Star
                                  size={14}
                                  color="#F5A623"
                                  fill="#F5A623"
                                />
                                <Text style={styles.ratingValue}>
                                  {ratingValue}
                                </Text>
                                <Text style={styles.ratingCount}>
                                  ({ratingCount})
                                </Text>
                              </View>
                            </View>
                            <Text
                              style={styles.recommendMeta}
                              numberOfLines={1}
                            >
                              {cuisineText}
                            </Text>
                            <Text
                              style={styles.recommendSubMeta}
                              numberOfLines={1}
                            >
                              {distanceText
                                ? `${distanceText} away | ${timeText}`
                                : timeText}
                            </Text>
                            <View style={styles.bestSellerPill}>
                              <Text
                                style={styles.bestSellerText}
                                numberOfLines={1}
                              >
                                {bestSellerText}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })()
                  }
                />
              )}

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
              ) : restaurants.length > 0 ? (
                <FlatList
                  data={restaurants}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{ paddingBottom: hp(8) }}
                  renderItem={({ item }) => (
                    <RestaurantListCard
                      item={item}
                      isFavorite={isFavourite?.(item.id, 'restaurant')}
                      onPress={() =>
                        navigation.navigate('RestaurantDetail', {
                          restaurant: item,
                        })
                      }
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
                    onPress={async () => {
                      setIsRefreshing(true);
                      await fetchHomeData(true);
                      setIsRefreshing(false);
                    }}
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

  headerBg: {
    paddingTop: hp(0),
    paddingBottom: hp(0.5),
    overflow: 'hidden',
  },

  headerBgImage: {
    opacity: 0.45,
    resizeMode: 'cover',
    alignSelf: 'flex-start',
  },

  headerGlass: {
    paddingHorizontal: wp(4.44),
    paddingBottom: hp(0),
    backgroundColor: 'transparent',
  },

  cartBadge: {
    position: 'absolute',
    top: hp(-0.75),
    right: wp(-1.67),
    minWidth: wp(5),
    height: hp(2.25),
    paddingHorizontal: wp(1.39),
    borderRadius: scale(9),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: scale(2),
    borderColor: '#ed1c24',
  },

  cartBadgeText: {
    color: '#ed1c24',
    fontSize: FONT.xs + scale(-2),
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp(2.5),
  },

  headerRowCompact: {
    paddingTop: hp(1.75),
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2.78),
  },

  addressBlock: {
    paddingTop: hp(0.125),
  },

  homeLabel: {
    fontSize: FONT.xs + scale(-1),
    color: '#8E8E93',
  },

  location: {
    fontSize: FONT.sm + scale(1),
    fontWeight: '600',
    marginTop: hp(0.25),
    color: '#111111',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3.33),
  },

  avatarRing: {
    width: wp(11.11),
    height: wp(11.11),
    borderRadius: scale(56),
    borderWidth: scale(2),
    borderColor: '#ed1c24',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  avatarImg: {
    width: wp(9.44),
    height: wp(9.44),
    borderRadius: scale(47),
    resizeMode: 'cover',
  },

  actionBtn: {
    width: wp(11.11),
    height: wp(11.11),
    borderRadius: scale(56),
    backgroundColor: '#ed1c24',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBox: {
    marginTop: hp(1.75),
    height: hp(6.5),
    borderRadius: scale(26),
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: scale(1),
    borderColor: 'rgba(0,0,0,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4.44),
    gap: wp(2.78),
  },

  searchBoxCompact: {
    height: hp(5.75),
    marginTop: hp(1.25),
  },

  searchInput: {
    flex: 1,
    fontSize: FONT.sm,
    color: '#111111',
    paddingVertical: 0,
  },

  tabs: {
    flexDirection: 'row',
    marginTop: hp(2.25),
  },

  tabsCompact: {
    marginTop: hp(1.5),
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
  },

  tabItemCompact: {
    paddingTop: hp(1.25),
    paddingBottom: hp(0.75),
  },

  tabText: {
    fontSize: FONT.sm + scale(2),
    color: '#111111',
    fontWeight: '700',
    opacity: 0.65,
  },

  tabTextActive: {
    fontSize: FONT.sm + scale(2),
    color: '#111111',
    fontWeight: '700',
    opacity: 1,
  },

  tabTextCompact: {
    fontSize: FONT.sm + scale(1),
  },

  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(0.25),
    backgroundColor: '#ed1c24',
  },

  foodList: {
    paddingLeft: wp(4.44),
    marginTop: hp(2.25),
    paddingBottom: hp(0.5),
  },

  foodItem: {
    alignItems: 'center',
    marginRight: wp(4.17),
    width: wp(25),
    height: hp(13.75),
    backgroundColor: '#FDEEEE',
    borderRadius: scale(22),
    paddingTop: hp(1.75),
    paddingBottom: hp(1.5),
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: scale(8),
    elevation: 2,
  },

  foodImage: {
    width: wp(16.67),
    height: hp(7.5),
    borderRadius: scale(32),
    marginBottom: hp(1.25),
  },

  foodTitle: {
    fontSize: FONT.xs,
    fontWeight: '500',
    color: '#2A2A2A',
  },

  promoList: {
    paddingLeft: wp(4.44),
    paddingRight: wp(1.67),
    marginTop: hp(2.25),
  },

  promoCard: {
    width: Math.round(PROMO_CARD_WIDTH),
    marginRight: PROMO_CARD_GAP,
    borderRadius: scale(20),
    overflow: 'hidden',
    backgroundColor: '#000000',
  },

  promoImage: {
    width: '100%',
    height: hp(18.75),
  },

  promoShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  promoOverlay: {
    position: 'absolute',
    top: hp(1.75),
    left: wp(3.89),
    right: wp(3.89),
  },

  promoTitle: {
    color: '#FFFFFF',
    fontSize: FONT.lg + scale(2),
    fontWeight: '400',
  },

  promoSub: {
    color: '#FFFFFF',
    fontSize: FONT.lg + scale(2),
    marginTop: hp(0.25),
    fontWeight: '400',
  },

  promoBtn: {
    marginTop: hp(1.25),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(10),
    paddingHorizontal: wp(3.89),
    paddingVertical: hp(0.75),
    alignSelf: 'flex-start',
  },

  promoBtnText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: '#111111',
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

  viewAll: {
    fontSize: FONT.sm,
    color: '#ed1c24',
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

  recommendCard: {
    width: wp(72.22),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    marginRight: wp(4.44),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: hp(0.5) },
    shadowRadius: scale(12),
    elevation: 4,
    overflow: 'visible',
  },

  recommendImageWrap: {
    position: 'relative',
    padding: wp(1.39),
  },

  recommendImage: {
    width: '100%',
    height: hp(18.125),
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
    borderRadius: scale(18),
  },

  favBtn: {
    position: 'absolute',
    top: hp(1.25),
    right: wp(2.78),
    width: wp(9.44),
    height: hp(4.25),
    borderRadius: scale(17),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: scale(6),
    elevation: 2,
  },

  imageDots: {
    position: 'absolute',
    right: wp(3.33),
    bottom: hp(1.25),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.67),
  },

  dot: {
    width: wp(1.67),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  dotActive: {
    width: wp(4.44),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: '#FFFFFF',
  },

  recommendBody: {
    padding: scale(12),
  },

  recommendTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(2.22),
  },

  recommendTitle: {
    fontSize: FONT.sm + scale(2),
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.11),
  },

  ratingValue: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: '#111111',
  },

  ratingCount: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
  },

  recommendMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },

  recommendSubMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },

  bestSellerPill: {
    marginTop: hp(1.25),
    backgroundColor: '#FDEEEE',
    borderRadius: scale(14),
    paddingHorizontal: wp(2.78),
    paddingVertical: hp(0.75),
    alignSelf: 'flex-start',
  },

  bestSellerText: {
    fontSize: FONT.xs,
    color: '#5B3B3B',
    fontWeight: '600',
  },

  listCard: {
    marginHorizontal: wp(4.44),
    marginTop: hp(1.75),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: hp(0.5) },
    shadowRadius: scale(12),
    overflow: 'visible',
  },

  listImageWrap: {
    position: 'relative',
  },

  listImage: {
    width: '100%',
    height: hp(19.375),
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
  },

  listFavBtn: {
    position: 'absolute',
    top: hp(1.25),
    right: wp(2.78),
    width: wp(9.44),
    height: hp(4.25),
    borderRadius: scale(17),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: scale(6),
    elevation: 2,
  },

  listImageDots: {
    position: 'absolute',
    right: wp(3.33),
    bottom: hp(1.25),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.67),
  },

  listDot: {
    width: wp(1.67),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  listDotActive: {
    width: wp(4.44),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: '#FFFFFF',
  },

  listBody: {
    padding: scale(12),
  },

  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(2.22),
  },

  listTitle: {
    fontSize: FONT.sm + scale(2),
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },

  listRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.11),
  },

  listRatingValue: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: '#111111',
  },

  listRatingCount: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
  },

  listMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },

  listSubMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },

  listBestSellerPill: {
    marginTop: hp(1.25),
    backgroundColor: '#FDEEEE',
    borderRadius: scale(14),
    paddingHorizontal: wp(2.78),
    paddingVertical: hp(0.75),
    alignSelf: 'flex-start',
  },

  listBestSellerText: {
    fontSize: FONT.xs,
    color: '#5B3B3B',
    fontWeight: '600',
  },

  priceText: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.5),
  },
});
