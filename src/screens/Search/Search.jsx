import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { Search as SearchIcon, RotateCcw, X } from 'lucide-react-native';
import { searchRestaurantsAndProducts, getSearchSuggestions } from '../../services/searchService';
import { getRestaurantDetails } from '../../services/restaurantService';

const FALLBACK_IMAGE = require('../../assets/images/Noodle.png');
const SEARCH_DEBOUNCE_DELAY = 500; // Debounce delay in milliseconds

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const skipDebounceRef = useRef(false);
  const abortControllerRef = useRef(null);
  const currentRequestIdRef = useRef(0);
  
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ restaurants: [], products: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [fetchingRestaurantId, setFetchingRestaurantId] = useState(null);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 Cleaning up - Aborting all in-flight requests');
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Cancel any in-flight requests when leaving screen
        if (abortControllerRef.current) {
          console.log('📴 Screen blur - Aborting in-flight requests');
          abortControllerRef.current.abort();
        }
        setQuery('');
        setSuggestions([]);
      };
    }, []),
  );

  useEffect(() => {
    if (route?.params?.autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus?.();
      }, 80);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [route?.params?.autoFocus]);

  // Handle initial category/query from route params
  useEffect(() => {
    const initialQuery = route?.params?.initialQuery || route?.params?.category;
    if (initialQuery) {
      console.log('📂 Category selected:', initialQuery);
      skipDebounceRef.current = true; // Skip debounce since we're doing immediate search
      setQuery(initialQuery);
      triggerSearch(initialQuery);
    }
  }, [route?.params?.initialQuery, route?.params?.category]);

  // Function to trigger search immediately (used for category clicks)
  const triggerSearch = async (searchQuery) => {
    if (searchQuery.trim().length === 0) return;

    try {
      // Cancel previous requests
      if (abortControllerRef.current) {
        console.log('❌ Cancelling previous search request...');
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      const currentRequestId = ++currentRequestIdRef.current;
      
      setLoading(true);
      const trimmedQuery = searchQuery.trim();
      console.log('🔍 Instant search for:', trimmedQuery, '(Request #' + currentRequestId + ')');
      
      // Fetch suggestions with 3s timeout
      try {
        console.log('💡 Fetching suggestions...');
        const suggestionPromise = getSearchSuggestions(trimmedQuery);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Suggestions timeout')), 3000)
        );
        const sug = await Promise.race([suggestionPromise, timeoutPromise]);
        
        // Only update if this is still the latest request
        if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
          console.log('✅ Suggestions fetched:', sug?.length || 0);
          setSuggestions(Array.isArray(sug) ? sug : []);
        }
      } catch (sugError) {
        // Only log if not aborted
        if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
          console.warn('⚠️ Suggestions error (non-blocking):', sugError?.message);
          setSuggestions([]);
        }
      }
      
      // Fetch full search results with 5s timeout
      try {
        console.log('🍽️ Fetching search results...');
        const resultsPromise = searchRestaurantsAndProducts(trimmedQuery);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), 5000)
        );
        const results = await Promise.race([resultsPromise, timeoutPromise]);
        
        // Only update if this is still the latest request
        if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
          console.log('✅ Search results fetched:', {
            restaurants: results?.results?.restaurants?.length || 0,
            products: results?.results?.products?.length || 0,
          });
          setSearchResults({
            restaurants: results?.results?.restaurants || [],
            products: results?.results?.products || [],
          });
        }
      } catch (searchError) {
        // Only log if not aborted
        if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
          console.error('❌ Search error:', searchError?.message);
          setSearchResults({ restaurants: [], products: [] });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounce search with proper request cancellation
  useEffect(() => {
    // Skip if already searched via triggerSearch
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Cancel previous request before starting new one
    if (abortControllerRef.current) {
      console.log('❌ Cancelling previous debounced search...');
      abortControllerRef.current.abort();
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (query.trim().length > 0) {
        try {
          // Cancel any previous request and create new one
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          abortControllerRef.current = new AbortController();
          const currentRequestId = ++currentRequestIdRef.current;

          setLoading(true);
          const trimmedQuery = query.trim();
          console.log('🔍 Debounced search for:', trimmedQuery, '(Request #' + currentRequestId + ')');
          
          // Fetch suggestions with timeout
          try {
            console.log('💡 Fetching suggestions...');
            const suggestionPromise = getSearchSuggestions(trimmedQuery);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Suggestions timeout')), 3000)
            );
            const sug = await Promise.race([suggestionPromise, timeoutPromise]);
            
            // Only update if this is still the latest request
            if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
              console.log('✅ Suggestions fetched:', sug?.length || 0);
              setSuggestions(Array.isArray(sug) ? sug : []);
            }
          } catch (sugError) {
            // Only log if not aborted
            if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
              console.warn('⚠️ Suggestions error (non-blocking):', sugError?.message);
              setSuggestions([]);
            }
          }
          
          // Fetch full search results with timeout
          try {
            console.log('🍽️ Fetching search results...');
            const resultsPromise = searchRestaurantsAndProducts(trimmedQuery);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Search timeout')), 5000)
            );
            const results = await Promise.race([resultsPromise, timeoutPromise]);
            
            // Only update if this is still the latest request
            if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
              console.log('✅ Search results fetched:', {
                restaurants: results?.results?.restaurants?.length || 0,
                products: results?.results?.products?.length || 0,
              });
              setSearchResults({
                restaurants: results?.results?.restaurants || [],
                products: results?.results?.products || [],
              });
            }
          } catch (searchError) {
            // Only log if not aborted
            if (currentRequestId === currentRequestIdRef.current && !abortControllerRef.current.signal.aborted) {
              console.error('❌ Search error:', searchError?.message);
              setSearchResults({ restaurants: [], products: [] });
            }
          }
        } catch (error) {
          console.error('❌ Unexpected error:', error?.message);
          setSearchResults({ restaurants: [], products: [] });
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setSearchResults({ restaurants: [], products: [] });
      }
    }, SEARCH_DEBOUNCE_DELAY);

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Combine results: suggestions first, then full search results
  const results = useMemo(() => {
    if (query.trim().length === 0) return [];

    const list = [];
    const addedIds = new Set(); // Track added items to avoid duplicates

    // Add suggestions first (quick results)
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      console.log('📋 Adding suggestions to results:', suggestions.length);
      suggestions.forEach(suggestion => {
        try {
          if (!suggestion || !suggestion.id) {
            console.warn('⚠️ Invalid suggestion:', suggestion);
            return;
          }

          // Skip duplicates
          if (addedIds.has(suggestion.id)) return;
          addedIds.add(suggestion.id);

          if (suggestion.type === 'restaurant') {
            list.push({
              type: 'restaurant',
              id: suggestion.id,
              restaurant: suggestion,
              title: suggestion.text || suggestion.name?.en || suggestion.name,
              subtitle: suggestion.cuisines?.join(', ') || 'Restaurant',
              image: suggestion.image,
              isFromSuggestions: true,
            });
          } else if (suggestion.type === 'dish') {
            const restaurantId = 
              suggestion?.restaurantId || 
              suggestion?.restaurant_id;

            list.push({
              type: 'dish',
              id: suggestion.id,
              product: {
                ...suggestion,
                restaurantId: restaurantId,
              },
              title: suggestion.text || suggestion.name?.en || suggestion.name,
              subtitle: suggestion.restaurantName?.en || suggestion.restaurantName || 'Dish',
              image: suggestion.image,
              isFromSuggestions: true,
            });
          }
        } catch (err) {
          console.warn('⚠️ Error processing suggestion:', err?.message, suggestion);
        }
      });
    }

    // Add restaurants from full search results
    if (Array.isArray(searchResults.restaurants)) {
      searchResults.restaurants.forEach(restaurant => {
        if (!restaurant?._id) {
          console.warn('⚠️ Restaurant missing _id:', restaurant);
          return;
        }

        // Skip if already added from suggestions
        if (addedIds.has(restaurant._id)) return;
        addedIds.add(restaurant._id);

        list.push({
          type: 'restaurant',
          id: restaurant._id,
          restaurant,
          title: restaurant.name?.en || restaurant.name,
          subtitle: restaurant.cuisines?.join(', ') || 'Restaurant',
          image: restaurant.image,
        });
      });
    }

    // Add products from full search results
    if (Array.isArray(searchResults.products)) {
      searchResults.products.forEach(product => {
        if (!product?._id) {
          console.warn('⚠️ Product missing _id:', product);
          return;
        }

        // Skip if already added from suggestions
        if (addedIds.has(product._id)) return;
        addedIds.add(product._id);

        // Extract restaurantId from various possible locations
        const restaurantId = 
          product?.restaurantId || 
          product?.restaurant_id || 
          product?.restaurant?._id ||
          product?.restaurant?.id;

        if (!restaurantId) {
          console.warn('⚠️ Product missing restaurantId:', product?.name);
        }

        list.push({
          type: 'dish',
          id: product._id,
          product: {
            ...product,
            // Ensure restaurantId is at top level
            restaurantId: restaurantId,
          },
          title: product.name?.en || product.name,
          subtitle: product.restaurantName?.en || product.restaurant?.name?.en || 'Dish',
          image: product.image,
          price: product.basePrice,
        });
      });
    }

    console.log('📊 Final results count:', list.length);
    return list;
  }, [query, suggestions, searchResults]);

  const handleResultPress = async (item) => {
    // Add to recent searches
    if (!recentSearches.includes(item.title)) {
      setRecentSearches(prev => [item.title, ...prev].slice(0, 5));
    }

    if (item.type === 'restaurant' && item.restaurant) {
      // Navigate directly to restaurant detail with restaurant data
      console.log('🍽️ Navigating to restaurant:', item.restaurant.name?.en || item.restaurant.name);
      
      navigation.getParent?.()
        ? navigation.getParent().navigate('Home', {
            screen: 'RestaurantDetail',
            params: { restaurant: item.restaurant },
          })
        : navigation.navigate('RestaurantDetail', {
            restaurant: item.restaurant,
          });
    } else if (item.type === 'dish' && item.product) {
      // For dishes, fetch the restaurant details using restaurantId
      // Try multiple locations to find restaurantId
      let restaurantId = 
        item.product?.restaurantId || 
        item.product?.restaurant_id || 
        item.restaurantId || 
        item.restaurant_id;
      
      // Debug: Log the actual structure
      console.log('📦 Dish product structure:', {
        hasRestaurantId: !!item.product?.restaurantId,
        hasRestaurantId_snake: !!item.product?.restaurant_id,
        allProductKeys: Object.keys(item.product || {}),
        productData: item.product,
      });

      if (!restaurantId) {
        console.error('❌ No restaurantId found in dish data:', item);
        Alert.alert(
          'Restaurant Info Missing',
          'Could not find restaurant information for this dish. Please try another dish or search.'
        );
        return;
      }

      try {
        setFetchingRestaurantId(item.id);
        console.log('📍 Fetching restaurant details for dish (ID:', restaurantId, ')');
        
        const restaurantData = await getRestaurantDetails(restaurantId);
        
        console.log('✅ Restaurant details fetched:', restaurantData?.name?.en || restaurantData?.name);
        
        // Navigate to restaurant detail with fetched restaurant data
        navigation.getParent?.()
          ? navigation.getParent().navigate('Home', {
              screen: 'RestaurantDetail',
              params: { restaurant: restaurantData },
            })
          : navigation.navigate('RestaurantDetail', {
              restaurant: restaurantData,
            });
      } catch (error) {
        console.error('❌ Error fetching restaurant details:', error?.message);
        Alert.alert(
          'Error',
          'Failed to load restaurant details. Please try again.'
        );
      } finally {
        setFetchingRestaurantId(null);
      }
    }
  };

  const handleTagPress = (tag) => {
    skipDebounceRef.current = true; // Skip debounce for tag press
    setQuery(tag);
    triggerSearch(tag);
    if (!recentSearches.includes(tag)) {
      setRecentSearches(prev => [tag, ...prev].slice(0, 5));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <Text style={styles.title}>Search</Text>

      {/* SEARCH BAR */}
      <View style={styles.searchBox}>
        <SearchIcon size={18} color="#9E9E9E" />
        <TextInput
          placeholder="Search Dish name & Restaurant.."
          placeholderTextColor="#9E9E9E"
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          ref={inputRef}
        />
        {query.length > 0 ? (
          <TouchableOpacity
            style={styles.clearBtn}
            activeOpacity={0.8}
            onPress={() => {
              // Cancel any in-flight requests
              if (abortControllerRef.current) {
                console.log('❌ Clear button - Aborting in-flight requests');
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
              }
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
              }
              setQuery('');
              setSuggestions([]);
              setSearchResults({ restaurants: [], products: [] });
            }}
          >
            <X size={16} color="#9E9E9E" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {query.trim().length > 0 ? (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF3D3D" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : results.length === 0 ? (
              <Text style={styles.emptyText}>No results found.</Text>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  Results ({results.length})
                </Text>
                {results.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.resultRow}
                    activeOpacity={0.85}
                    onPress={() => handleResultPress(item)}
                    disabled={fetchingRestaurantId === item.id}
                  >
                    <Image
                      source={
                        item.image && typeof item.image === 'string'
                          ? { uri: item.image }
                          : FALLBACK_IMAGE
                      }
                      style={styles.resultImage}
                    />
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.resultSub} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                      {typeof item.price === 'number' ? (
                        <Text style={styles.resultPrice}>
                          ₹ {item.price.toFixed(0)}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.resultTypeContainer}>
                      {fetchingRestaurantId === item.id ? (
                        <ActivityIndicator size="small" color="#FF3D3D" />
                      ) : (
                        <Text style={styles.resultType}>
                          {item.type === 'restaurant' ? 'Restaurant' : 'Dish'}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {/* RECENT SEARCH */}
            {recentSearches.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Your Recent Searches</Text>

                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={String(index)}
                    style={styles.recentItem}
                    activeOpacity={0.8}
                    onPress={() => setQuery(search)}
                  >
                    <RotateCcw size={16} color="#6E6E6E" />
                    <Text style={styles.recentText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* POPULAR SEARCH */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Popular Searches
            </Text>

            <View style={styles.tagWrapper}>
              <Tag
                label="Pizza"
                onPress={() => handleTagPress('Pizza')}
              />
              <Tag
                label="Burger"
                onPress={() => handleTagPress('Burger')}
              />
              <Tag
                label="Margherita"
                onPress={() => handleTagPress('Margherita')}
              />
              <Tag
                label="Italian"
                onPress={() => handleTagPress('Italian')}
              />
              <Tag
                label="Fast Food"
                onPress={() => handleTagPress('Fast Food')}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* TAG COMPONENT */
const Tag = ({ label, onPress }) => (
  <TouchableOpacity style={styles.tag} activeOpacity={0.8} onPress={onPress}>
    <Text style={styles.tagText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },

  title: {
    marginTop: 50,
    marginBottom: 20,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    marginBottom: 24,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#000',
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6E6E6E',
    marginBottom: 12,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6E6E6E',
  },

  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  recentText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#000',
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F4F4F4',
  },
  resultContent: {
    flex: 1,
    marginLeft: 10,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  resultSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#6E6E6E',
  },
  resultPrice: {
    marginTop: 4,
    fontSize: 12,
    color: '#111',
    fontWeight: '600',
  },
  resultType: {
    fontSize: 10,
    color: '#9E9E9E',
  },
  resultTypeContainer: {
    minWidth: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 10,
  },

  tagWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  tag: {
    backgroundColor: '#FFECEC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },

  tagText: {
    fontSize: 13,
    color: '#000',
  },
});
