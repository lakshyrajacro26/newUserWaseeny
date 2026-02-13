import React, { useContext, useMemo, useState, useEffect, useCallback, memo } from 'react';
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
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

import { CartContext } from '../../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

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

  if (typeof image === 'number') return image;

  if (typeof image === 'string') return { uri: image };

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

  return { status: 'Preparing', statusColor: '#F2994A' };
}

export default function OrdersScreen() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { orders, fetchOrders } = useContext(CartContext);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
    } catch (error) {
      console.log('Refresh error:', error?.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMemo(() => {
    return (orders || [])
      .filter(o => {
        const hasDeliveryAddress = !!o?.deliveryAddress;
        return hasDeliveryAddress;
      })
      .map(o => {
        const ui = deriveStatusUi(o);
        return {
          ...o,
          ...ui,
        };
      })
      .filter(o => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Ongoing') return o.status === 'Ongoing' || o.status === 'Preparing';
        if (statusFilter === 'Completed') return o.completed === true;
        if (statusFilter === 'Cancelled') return o.status === 'Cancelled';
        return true;
      });
  }, [orders, statusFilter]);

  const handleFilterChange = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Your Orders</Text>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {['All', 'Ongoing', 'Completed', 'Cancelled'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              statusFilter === status && styles.filterChipActive,
            ]}
            onPress={() => handleFilterChange(status)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === status && styles.filterChipTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {statusFilter !== 'All' ? `No ${statusFilter.toLowerCase()} orders` : 'No orders yet'}
          </Text>
          <Text style={styles.emptySubText}>
            {statusFilter === 'All' && 'Your orders will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item._id || item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.lg }}
          renderItem={({ item }) => <OrderCard item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ed1c24']}
              tintColor="#ed1c24"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const OrderCard = memo(function OrderCard({ item }) {
  const navigation = useNavigation();

  const handlePress = useCallback(() => {
    navigation.navigate("OrderDetailsScreen", { orderId: item._id || item.id });
  }, [navigation, item._id, item.id]);
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
    <Pressable style={styles.card} onPress={handlePress}>
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
  },

  header: {
    marginTop: hp(6),
    marginBottom: SPACING.lg,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000000',
  },

  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    borderRadius: scale(22),
    padding: scale(4),
    marginBottom: SPACING.lg,
  },

  tabBtn: {
    flex: 1,
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabActive: {
    backgroundColor: '#ed1c24',
  },

  tabText: {
    fontSize: FONT_SIZES.xs,
    color: '#000000',
    fontWeight: '500',
  },

  tabTextActive: {
    color: '#FFFFFF',
  },

  filterContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },

  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: scale(20),
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  filterChipActive: {
    backgroundColor: '#ed1c24',
    borderColor: '#ed1c24',
  },

  filterChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: '#666666',
  },

  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  card: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: scale(12),
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  restaurant: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#000',
  },

  cuisine: {
    fontSize: FONT_SIZES.xs,
    color: '#828282',
    marginTop: scale(2),
  },

  itemsWrapper: {
    marginVertical: SPACING.sm,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(6),
  },

  itemImg: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(6),
    marginRight: SPACING.sm,
  },

  itemTitle: {
    fontSize: FONT_SIZES.xs,
    color: '#000',
  },

  itemSub: {
    fontSize: FONT_SIZES.xs,
    color: '#828282',
  },

  moreText: {
    fontSize: FONT_SIZES.xs,
    color: '#828282',
    marginLeft: scale(44),
    marginTop: scale(2),
  },

  date: {
    fontSize: FONT_SIZES.xs,
    color: '#828282',
  },

  status: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginTop: scale(4),
  },

  price: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#000',
  },

  noteBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: scale(8),
    padding: scale(10),
    marginTop: scale(10),
  },

  noteText: {
    fontSize: FONT_SIZES.xs,
    color: '#4F4F4F',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },

  review: {
    fontSize: FONT_SIZES.xs,
    color: '#EB5757',
  },

  reorderBtn: {
    backgroundColor: '#EB5757',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: scale(8),
  },

  reorderText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: '#828282',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },

  emptyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },

  emptySubText: {
    fontSize: FONT_SIZES.xs,
    color: '#828282',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});