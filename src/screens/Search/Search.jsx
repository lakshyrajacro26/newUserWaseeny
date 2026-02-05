import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { Search as SearchIcon, RotateCcw, X } from 'lucide-react-native';
import { restaurants } from '../../Data/Restaurant';

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setQuery('');
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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const list = [];

    restaurants.forEach(restaurant => {
      if (
        restaurant?.name?.toLowerCase().includes(q) ||
        restaurant?.cuisines?.some(c => c.toLowerCase().includes(q))
      ) {
        list.push({
          type: 'restaurant',
          id: `rest-${restaurant.id}`,
          restaurant,
          title: restaurant.name,
          subtitle: restaurant.cuisines?.join(', ') || 'Restaurant',
          image: restaurant.coverImage,
        });
      }

      const fromPopular = Array.isArray(restaurant?.popularItems)
        ? restaurant.popularItems
        : [];
      const fromMenu = Array.isArray(restaurant?.menu)
        ? restaurant.menu.flatMap(c => c?.items || [])
        : [];
      const items = [...fromPopular, ...fromMenu];

      items.forEach(item => {
        if (item?.name?.toLowerCase().includes(q)) {
          list.push({
            type: 'item',
            id: `item-${restaurant.id}-${item.id}`,
            restaurant,
            title: item.name,
            subtitle: restaurant.name,
            image: item.image || restaurant.coverImage,
            price: item.price,
          });
        }
      });
    });

    return list;
  }, [query]);

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
            onPress={() => setQuery('')}
          >
            <X size={16} color="#9E9E9E" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {query.trim().length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Results</Text>
            {results.length === 0 ? (
              <Text style={styles.emptyText}>No results found.</Text>
            ) : (
              results.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultRow}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.getParent?.()
                      ? navigation.getParent().navigate('Home', {
                          screen: 'RestaurantDetail',
                          params: { restaurant: item.restaurant },
                        })
                      : navigation.navigate('RestaurantDetail', {
                          restaurant: item.restaurant,
                        })
                  }
                >
                  <Image
                    source={{ uri: item.image }}
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
                        ₹ {item.price.toFixed(2)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.resultType}>
                    {item.type === 'restaurant' ? 'Restaurant' : 'Dish'}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <>
            {/* RECENT SEARCH */}
            <Text style={styles.sectionTitle}>Your Recent Searches</Text>

            <TouchableOpacity
              style={styles.recentItem}
              activeOpacity={0.8}
              onPress={() => setQuery('Margherita Pizza')}
            >
              <RotateCcw size={16} color="#6E6E6E" />
              <Text style={styles.recentText}>Margherita Pizza</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recentItem}
              activeOpacity={0.8}
              onPress={() => setQuery('Cellar Door Restaurant')}
            >
              <RotateCcw size={16} color="#6E6E6E" />
              <Text style={styles.recentText}>Cellar Door Restaurant</Text>
            </TouchableOpacity>

            {/* POPULAR SEARCH */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Popular Searches
            </Text>

            <View style={styles.tagWrapper}>
              <Tag
                label="Spicy Wings"
                onPress={() => setQuery('Spicy Wings')}
              />
              <Tag
                label="Cellar Door Restaurant"
                onPress={() => setQuery('Cellar Door Restaurant')}
              />
              <Tag
                label="Cellar Door Restaurant"
                onPress={() => setQuery('Cellar Door Restaurant')}
              />
              <Tag
                label="Spicy Wings"
                onPress={() => setQuery('Spicy Wings')}
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
