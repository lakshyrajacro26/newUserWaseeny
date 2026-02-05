import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, MoreVertical, Phone } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import { CartContext } from '../../context/CartContext';
import { toNumber } from '../../services/cartPricing';

const FALLBACK_HEADER = require('../../assets/images/Noodle.png');

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const options = {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  const formatted = d.toLocaleString('en-US', options);
  return `On ${formatted.replace(',', ' at')}`;
}

function formatOptionsLine(item) {
  const parts = [];
  if (item?.selectedFlavor?.label) parts.push(item.selectedFlavor.label);
  if (Array.isArray(item?.addOns) && item.addOns.length > 0) {
    parts.push(
      item.addOns
        .map(a => a?.label)
        .filter(Boolean)
        .join(', '),
    );
  }
  return parts.join(' • ');
}

function imgSource(uri) {
  if (typeof uri === 'string' && uri.trim().length > 0) return { uri };
  return FALLBACK_HEADER;
}

export default function OrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { getOrderById } = useContext(CartContext);

  const orderId = route?.params?.orderId;
  const order = useMemo(
    () => (orderId ? getOrderById?.(orderId) : null),
    [getOrderById, orderId],
  );

  const items = Array.isArray(order?.items) ? order.items : [];
  const first = items[0];

  const restaurantName =
    order?.restaurantName ||
    first?.restaurantName ||
    first?.restaurant?.name ||
    'Restaurant';

  const restaurantTags =
    order?.restaurantTags ||
    first?.restaurant?.tags ||
    'Pizza, Italian, Fast Food';

  const totals = {
    subtotal: toNumber(order?.totals?.subtotal, 0),
    delivery: toNumber(order?.totals?.delivery, 0),
    serviceFee: toNumber(
      order?.totals?.serviceFee ?? order?.totals?.service,
      0,
    ),
    discount: toNumber(order?.totals?.discount, 0),
    grandTotal: toNumber(order?.totals?.grandTotal, 0),
  };

  const statusLine =
    order?.status === 'delivered'
      ? 'Your order has been delivered!'
      : order?.status === 'cancelled'
      ? 'Your order was cancelled.'
      : 'Your food is being prepared fresh!';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER IMAGE - EXACT like image */}
      <View style={styles.imageWrapper}>
        <ImageBackground
          source={imgSource(first?.image)}
          style={styles.headerImage}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#FFFFFF']}
            locations={[0.35, 0.75, 1]}
            style={styles.headerFade}
          />

          <View style={styles.headerTopBar}>
            <TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('MainTabs', {
                  screen: 'Home',
                  params: { screen: 'HomePage' },
                })
              }
            >
              <ArrowLeft size={20} color="#111" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreBtn}>
              <MoreVertical size={20} color="#111" />
            </TouchableOpacity>
          </View>

          {/* Restaurant info - EXACT position like image */}
          <View style={styles.imageContent}>
            <View style={styles.headerInfoRow}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.restaurantImageName}>{restaurantName}</Text>
                <Text style={styles.restaurantImageTags}>{restaurantTags}</Text>
                <View style={styles.menuButtonContainer}>
                  <Text style={styles.menuButtonText}>Menu &gt;</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.callButton} activeOpacity={0.85}>
                <Phone size={14} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Call Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ORDER STATUS BANNER */}
        <View style={styles.statusSection}>
          <Text style={styles.statusText}>🔥 “{statusLine}”</Text>
        </View>

        {/* ITEMS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({items.length})</Text>

          {items.map(item => {
            const lineTotal =
              toNumber(item?.totalPrice, null) ??
              toNumber(item?.unitTotal, null) ??
              toNumber(item?.price, 0) *
                toNumber(item?.quantity ?? item?.qty, 1);
            const subLine = formatOptionsLine(item) || 'Regular';

            return (
              <View style={styles.itemRow} key={item?.id ?? item?.name}>
                <Image
                  source={imgSource(item?.image)}
                  style={styles.itemThumb}
                />
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item?.name || 'Item'}</Text>
                  <Text style={styles.itemSub}>{subLine}</Text>
                </View>
                <Text style={styles.price}>
                  ₹ {toNumber(lineTotal, 0).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* BILL DETAILS SECTION */}
        <View style={styles.billSection}>
          <Text style={styles.sectionTitle}>Bill Details</Text>

          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>
                ₹ {totals.subtotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Standard Delivery</Text>
              {totals.delivery === 0 ? (
                <Text style={styles.deliveryFree}>Free</Text>
              ) : (
                <Text style={styles.billValue}>
                  ₹ {totals.delivery.toFixed(2)}
                </Text>
              )}
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Service Fee</Text>
              <Text style={styles.billValue}>
                ₹ {totals.serviceFee.toFixed(2)}
              </Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Grand Total</Text>
              <Text style={styles.grandTotal}>
                ₹ {totals.grandTotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.couponRow}>
              <Text style={styles.couponLabel}>Coupon Applied</Text>
              <Text style={styles.couponValue}>
                -₹ {totals.discount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.paidRow}>
              <Text style={styles.paidLabel}>Paid</Text>
              <Text style={styles.paidValue}>
                ₹ {totals.grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.savingsBox}>
            <Text style={styles.savingsText}>
              Hurry! You saved ₹ {totals.discount.toFixed(2)} on this order.
            </Text>
          </View>
        </View>

        {/* ADDRESS + ORDER INFO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoBlock}>
            <View style={styles.rowBetween}>
              <Text style={styles.infoTitle}>Delivering Address</Text>
              <TouchableOpacity>
                <Text style={styles.trackLink}>Track Order</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.address}>
              Jetty Point – Gate No. 2, Marina Bay, New Delhi
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoBlockCompact}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>#7892020189</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoBlockCompact}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>Via Credit Card</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoBlockCompact}>
            <Text style={styles.infoLabel}>Payment Time & Date</Text>
            <Text style={styles.infoValue}>On 24, May at 11:59 PM</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  imageWrapper: {
    height: 230,
    width: '100%',
  },

  headerImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  headerFade: {
    ...StyleSheet.absoluteFillObject,
  },

  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 10,
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  imageContent: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    paddingBottom: 14,
  },

  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  headerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },

  restaurantImageName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
  },

  restaurantImageTags: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },

  menuButtonContainer: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },

  menuButtonText: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '600',
  },

  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },

  callButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  scrollContent: {
    paddingBottom: 30,
  },

  statusSection: {
    backgroundColor: '#FDEEEE',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 13,
    color: '#111111',
    textAlign: 'center',
  },

  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F3F3',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 2,
  },

  itemThumb: {
    width: 42,
    height: 42,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#F3F3F3',
  },

  itemContent: {
    flex: 1,
    marginRight: 10,
  },

  itemName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },

  itemSub: {
    fontSize: 11,
    color: '#828282',
  },

  price: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },

  billSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },

  billCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },

  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 2,
  },

  billLabel: {
    fontSize: 12,
    color: '#4F4F4F',
  },

  billValue: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },

  deliveryFree: {
    fontSize: 12,
    color: '#EB5757',
    fontWeight: '500',
  },

  grandTotal: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '700',
  },

  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 2,
  },

  couponLabel: {
    fontSize: 12,
    color: '#4F4F4F',
    fontStyle: 'italic',
  },

  couponValue: {
    fontSize: 12,
    color: '#EB5757',
    fontWeight: '500',
  },

  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 2,
  },

  paidLabel: {
    fontSize: 12,
    color: '#4F4F4F',
    fontWeight: '600',
  },

  paidValue: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '700',
  },

  savingsBox: {
    marginTop: 16,
    backgroundColor: '#FDEEEE',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },

  savingsText: {
    fontSize: 12,
    color: '#D35400',
    fontWeight: '600',
    textAlign: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  infoBlock: {
    paddingVertical: 8,
  },

  infoBlockCompact: {
    paddingVertical: 10,
  },

  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },

  trackLink: {
    fontSize: 12,
    color: '#EB5757',
    fontWeight: '600',
  },

  address: {
    fontSize: 12,
    color: '#4F4F4F',
    lineHeight: 18,
    marginTop: 6,
  },

  infoLabel: {
    fontSize: 12,
    color: '#828282',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
});
