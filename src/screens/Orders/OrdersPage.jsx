import React, { useContext, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronRight } from 'lucide-react-native';

import { CartContext } from '../../context/CartContext';
import { useNavigation } from '@react-navigation/native';

const FALLBACK_ITEM_IMAGE = require('../../assets/images/Noodle.png');

function formatOrderDateTime(isoString) {
  const date = isoString ? new Date(isoString) : new Date();
  if (Number.isNaN(date.getTime())) return { dateLine1: '', dateLine2: '' };

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];

  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = ((hours24 + 11) % 12) + 1;

  return {
    dateLine1: `Order placed on ${day}, ${month},`,
    dateLine2: `${hours12}:${minutes}${ampm}`,
  };
}

function getImageSource(image) {
  if (!image) return FALLBACK_ITEM_IMAGE;

  // RN local asset via require(...) is a number
  if (typeof image === 'number') return image;

  // Remote image url
  if (typeof image === 'string') return { uri: image };

  // Already a valid source object
  if (typeof image === 'object') return image;

  return FALLBACK_ITEM_IMAGE;
}

function deriveStatusUi(order) {
  const raw = String(order?.status || '').toLowerCase();

  if (raw.includes('complete') || raw.includes('delivered')) {
    return { status: 'Completed', statusColor: '#27AE60', completed: true };
  }

  if (raw.includes('cancel')) {
    return { status: 'Cancelled', statusColor: '#9E9E9E' };
  }

  if (
    raw.includes('ongoing') ||
    raw.includes('out_for_delivery') ||
    raw.includes('shipping')
  ) {
    return {
      status: 'Ongoing',
      statusColor: '#EB5757',
      note: 'Your order is arriving soon, please be ready at Dock Gate 2',
    };
  }

  // confirmed / preparing / placed / default
  return { status: 'Preparing', statusColor: '#F2994A' };
}

export default function OrdersScreen() {
  const [tab, setTab] = useState('Delivery');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const { orders, fetchOrders } = useContext(CartContext);

  // Fetch orders when component mounts
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        await fetchOrders();
      } catch (error) {
        console.log('Orders screen error:', error?.message);
        setFetchError(error?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [fetchOrders]);

  const data = useMemo(() => {
    const normalizedQuery = String(query || '')
      .trim()
      .toLowerCase();
    const wantType = tab === 'Pickup' ? 'pickup' : 'delivery';

    return (orders || [])
      .filter(o => {
        // Determine order type: if deliveryAddress exists, it's delivery; otherwise pickup
        const hasDeliveryAddress = !!o?.deliveryAddress;
        const type = hasDeliveryAddress ? 'delivery' : 'pickup';
        return type === wantType;
      })
      .filter(o => {
        if (!normalizedQuery) return true;
        const restaurantName = o?.restaurant?.name?.en || o?.restaurant?.name || 'Restaurant';
        const itemsText = (o?.items || [])
          .map(it => it?.name || it?.product?.name?.en || it?.productName)
          .filter(Boolean)
          .join(' ');
        return `${restaurantName} ${itemsText}`
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .map(o => {
        const ui = deriveStatusUi(o);
        return {
          ...o,
          ...ui,
        };
      });
  }, [orders, query, tab]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Your Orders</Text>

      {/* Tabs */}
      <View style={styles.tabWrapper}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'Delivery' && styles.tabActive]}
          onPress={() => setTab('Delivery')}
        >
          <Text
            style={[styles.tabText, tab === 'Delivery' && styles.tabTextActive]}
          >
            Delivery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === 'Pickup' && styles.tabActive]}
          onPress={() => setTab('Pickup')}
        >
          <Text
            style={[styles.tabText, tab === 'Pickup' && styles.tabTextActive]}
          >
            Pickup
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={16} color="#9E9E9E" />
        <TextInput
          placeholder="Search Order"
          placeholderTextColor="#9E9E9E"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {query ? 'No orders found matching your search' : 'No orders yet'}
          </Text>
          <Text style={styles.emptySubText}>
            {!query && 'Your orders will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item._id || item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => <OrderCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function OrderCard({ item }) {
  const navigation = useNavigation();
  const restaurantName =
    item?.restaurant?.name?.en || item?.restaurant?.name || item?.restaurantName || 'Restaurant';

  const items = Array.isArray(item?.items) ? item.items : [];
  const shownItems = items.slice(0, 2);
  const remainingCount = Math.max(0, items.length - shownItems.length);

  const cuisineLine = items
    .map(it => it?.name || it?.product?.name?.en || it?.productName)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

  const { dateLine1, dateLine2 } = formatOrderDateTime(item?.createdAt);

  // Handle multiple possible total field names from backend
  const total =
    typeof item?.totalAmount === 'number'
      ? item.totalAmount
      : typeof item?.totals?.grandTotal === 'number'
      ? item.totals.grandTotal
      : typeof item?.grandTotal === 'number'
      ? item.grandTotal
      : typeof item?.totals?.subtotal === 'number'
      ? item.totals.subtotal
      : typeof item?.subtotal === 'number'
      ? item.subtotal
      : 0;

  return (
    <Pressable style={styles.card} onPress={() => navigation.navigate("OrderDetailsScreen", { orderId: item._id || item.id })}>
      {/* Restaurant */}
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.restaurant}>{restaurantName}</Text>
          <Text style={styles.cuisine} numberOfLines={1}>
            {cuisineLine || '—'}
          </Text>
        </View>
        <ChevronRight size={18} color="#BDBDBD" />
      </View>

      {/* Items */}
      <View style={styles.itemsWrapper}>
        {shownItems.map((it, idx) => (
          <View key={String(it?._id || it?.id || idx)} style={styles.itemRow}>
            <Image source={getImageSource(it?.image || it?.product?.image)} style={styles.itemImg} />
            <View>
              <Text style={styles.itemTitle}>{it?.name || it?.product?.name?.en || it?.productName || 'Item'} </Text>
              <Text style={styles.itemSub}>
                {it?.selectedFlavor?.name || it?.variation?.name || it?.selectedFlavor?.title || it?.quantity ? `Qty: ${it.quantity}` : '—'}
              </Text>
            </View>
          </View>
        ))}

        {remainingCount > 0 && (
          <Text style={styles.moreText}>+{remainingCount} More</Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.rowBetween}>
        <View>
          {!!dateLine1 && <Text style={styles.date}>{dateLine1}</Text>}
          {!!dateLine2 && <Text style={styles.date}>{dateLine2}</Text>}
          <Text style={[styles.status, { color: item.statusColor }]}>
            {item.status}
          </Text>
        </View>

        <Text style={styles.price}>₹ {Number(total || 0).toFixed(2)}</Text>
      </View>

      {/* Ongoing Note */}
      {item.note && (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{item.note} 🚴</Text>
        </View>
      )}

      {/* Completed */}
      {item.completed && (
        <View style={styles.actionRow}>
          <Text style={styles.review}>Rating and review</Text>
          <TouchableOpacity style={styles.reorderBtn}>
            <Text style={styles.reorderText}>Reorder</Text>
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },

  header: {
    marginTop: 48,
    marginBottom: 20,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000000',
  },

  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    borderRadius: 22,
    padding: 4,
    marginBottom: 16,
  },

  tabBtn: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabActive: {
    backgroundColor: '#000000',
  },

  tabText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },

  tabTextActive: {
    color: '#FFFFFF',
  },

  searchBox: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#000',
  },

  card: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  restaurant: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  cuisine: {
    fontSize: 12,
    color: '#828282',
    marginTop: 2,
  },

  itemsWrapper: {
    marginVertical: 12,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  itemImg: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 8,
  },

  itemTitle: {
    fontSize: 13,
    color: '#000',
  },

  itemSub: {
    fontSize: 11,
    color: '#828282',
  },

  moreText: {
    fontSize: 12,
    color: '#828282',
    marginLeft: 44,
    marginTop: 2,
  },

  date: {
    fontSize: 11,
    color: '#828282',
  },

  status: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },

  noteBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },

  noteText: {
    fontSize: 11,
    color: '#4F4F4F',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  review: {
    fontSize: 12,
    color: '#EB5757',
  },

  reorderBtn: {
    backgroundColor: '#EB5757',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  reorderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#828282',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },

  emptySubText: {
    fontSize: 13,
    color: '#828282',
    marginTop: 8,
    textAlign: 'center',
  },
});