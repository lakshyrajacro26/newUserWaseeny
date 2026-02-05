import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { CartContext } from '../context/CartContext';
import { toNumber } from '../services/cartPricing';

function groupByRestaurant(cart) {
  const items = Array.isArray(cart) ? cart : [];
  const map = new Map();

  for (const it of items) {
    const key = String(it.restaurantId ?? 'na');
    if (!map.has(key)) {
      map.set(key, {
        restaurantId: it.restaurantId ?? null,
        restaurantName:
          it.restaurantName ?? it.restaurant?.name ?? 'Restaurant',
        restaurant: it.restaurant ?? null,
        items: [],
      });
    }
    map.get(key).items.push(it);
  }

  return Array.from(map.values());
}

function formatOptionsLine(item) {
  const parts = [];
  if (item?.selectedFlavor?.label) parts.push(item.selectedFlavor.label);
  if (Array.isArray(item?.addOns) && item.addOns.length > 0) {
    parts.push(
      item.addOns
        .map(a => a.label)
        .filter(Boolean)
        .join(', '),
    );
  }
  return parts.join(' • ');
}

export default function CartScreen() {
  const navigation = useNavigation();
  const rootNav = navigation.getParent?.();
  const {
    cart,
    totals,
    incrementItem,
    decrementItem,
    removeFromCart,
    addToCart,
  } = useContext(CartContext);

  const groups = useMemo(() => groupByRestaurant(cart), [cart]);
  const hasItems = Array.isArray(cart) && cart.length > 0;

  const coupons = useMemo(
    () => [
      {
        id: 'FLAT50',
        label: 'Get flat ₹50 off on your first order.',
        amount: 50,
      },
      {
        id: 'FLAT50-2',
        label: 'Get flat ₹50 off on your first order.',
        amount: 50,
      },
    ],
    [],
  );
  const [appliedCouponId, setAppliedCouponId] = useState(null);

  const delivery = 0;
  const tax = 0;
  const subtotal = toNumber(totals?.subtotal, 0);
  const appliedCoupon = coupons.find(c => c.id === appliedCouponId) || null;
  const discount = appliedCoupon ? Math.min(appliedCoupon.amount, subtotal) : 0;
  const grandTotal = subtotal + delivery + tax - discount;
  const estimatedDelivery = 'Standard (20-35 minutes)';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <ChevronLeft size={18} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {!hasItems ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySub}>
              Add items from a restaurant to get started.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.deliveryCard}>
              <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
              <Text style={styles.deliveryValue}>{estimatedDelivery}</Text>
              <TouchableOpacity style={styles.deliveryChange}>
                <Text style={styles.deliveryChangeText}>Change</Text>
              </TouchableOpacity>
            </View>

            {groups.map(group => {
              const offers = group.restaurant?.offers;
              const popular = group.restaurant?.popularItems;
              return (
                <View
                  key={String(group.restaurantId ?? 'na')}
                  style={styles.group}
                >
                  <View style={styles.restaurantHeader}>
                    <View>
                      <Text style={styles.restaurantName}>
                        {group.restaurantName}
                      </Text>
                      <Text style={styles.restaurantMeta}>
                        {group.restaurant?.cuisines?.join?.(', ') ||
                          'Pizza, Italian, Fast Food'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.restaurantArrow}>
                      <Text style={styles.restaurantArrowText}>›</Text>
                    </TouchableOpacity>
                  </View>

                  {group.items.map(ci => (
                    <View key={ci.id} style={styles.itemCard}>
                      <Image
                        source={ci.image && ci.image.trim() ? { uri: ci.image } : require('../assets/images/Food.png')}
                        style={styles.itemImg}
                      />

                      <View style={styles.qtyOverlay}>
                        <View style={styles.qtyWrap}>
                          <TouchableOpacity
                            onPress={() => decrementItem(ci.cartLineId ?? ci.id)}

                            style={styles.qtyBtn}
                            activeOpacity={0.85}
                          >
                            <Minus size={14} color="#E53935" />
                          </TouchableOpacity>

                          <Text style={styles.qtyText}>
                            {toNumber(ci.quantity, 1)}
                          </Text>

                          <TouchableOpacity
                            onPress={() => incrementItem(ci.cartLineId ?? ci.id)}
                            style={styles.qtyBtn}
                            activeOpacity={0.85}
                          >
                            <Plus size={14} color="#E53935" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={2} style={styles.itemName}>
                          {ci.name}
                        </Text>
                        <Text style={styles.itemSubtitle}>Original</Text>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <TouchableOpacity style={styles.itemEdit}>
                            <Text style={styles.itemEditText}>Edit</Text>
                          </TouchableOpacity>
                          {!!formatOptionsLine(ci) && (
                            <Text numberOfLines={2} style={styles.itemOptions}>
                              {formatOptionsLine(ci)}
                            </Text>
                          )}

                          <View style={styles.itemBottomRow}>
                            <Text style={styles.itemPrice}>
                              ₹{toNumber(ci.totalPrice, 0)}
                            </Text>

                            <TouchableOpacity
                              onPress={() => removeFromCart(ci.id)}
                              style={styles.trashBtn}
                              activeOpacity={0.85}
                            >
                              <Trash2 size={16} color="#777" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.itemTotalsRow}>
                          <Text style={styles.itemTotalsText}>
                            Items Count : {toNumber(ci.quantity, 1)}
                          </Text>
                          <Text style={styles.itemTotalsText}>
                            Total Price : ₹{toNumber(ci.totalPrice, 0)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity style={styles.addMore} onPress={() => navigation.goBack()}>
                    <Text style={styles.addMoreText}>+ Add More Items</Text>
                  </TouchableOpacity>

                  <Text style={styles.sectionTitle}>Offers</Text>

                  {coupons.map(coupon => {
                    const isApplied = appliedCouponId === coupon.id;
                    return (
                      <View key={coupon.id} style={styles.couponCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.couponTitle}>{coupon.label}</Text>
                          <View style={styles.couponCodeWrap}>
                            <Text style={styles.couponCode}>{coupon.id}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={
                            isApplied
                              ? styles.couponApplied
                              : styles.couponApply
                          }
                          onPress={() =>
                            setAppliedCouponId(prev =>
                              prev === coupon.id ? null : coupon.id,
                            )
                          }
                          activeOpacity={0.85}
                        >
                          <Text
                            style={
                              isApplied
                                ? styles.couponAppliedText
                                : styles.couponApplyText
                            }
                          >
                            {isApplied ? 'Applied' : 'Apply'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  <TouchableOpacity style={styles.viewCoupons}>
                    <Text style={styles.viewCouponsText}>View all Coupons</Text>
                    <Text style={styles.viewCouponsArrow}>›</Text>
                  </TouchableOpacity>

                  <View style={styles.billBox}>
                    <Text style={styles.billTitle}>Bill Details</Text>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Subtotal</Text>
                      <Text style={styles.billValue}>₹{subtotal}</Text>
                    </View>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Standard Delivery</Text>
                      <Text style={styles.billFree}>Free</Text>
                    </View>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Service Fee</Text>
                      <Text style={styles.billValue}>₹{tax.toFixed(2)}</Text>
                    </View>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Offer Applied</Text>
                      <Text style={styles.billDiscount}>
                        -₹{discount.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.billDivider} />
                    <View style={styles.billRow}>
                      <Text style={styles.billTotal}>Grand Total</Text>
                      <Text style={styles.billTotal}>
                        ₹{grandTotal.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {Array.isArray(popular) && popular.length > 0 && (
                    <View style={styles.popularBox}>
                      <Text style={styles.popularTitle}>
                        Popular with your Order
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.popularList}
                      >
                        {popular.slice(0, 6).map(pi => (
                          <View key={pi.id} style={styles.popularCard}>
                            <Image
                              source={{ uri: pi.image }}
                              style={styles.popularImg}
                            />
                            <Text numberOfLines={1} style={styles.popularName}>
                              {pi.name}
                            </Text>
                            <Text style={styles.popularSub} numberOfLines={1}>
                              {pi.description || '6 pcs chicken wings'}
                            </Text>
                            <Text style={styles.popularPrice}>
                              ₹{toNumber(pi.price, 0)}
                            </Text>
                            <TouchableOpacity
                              style={styles.popularAdd}
                              activeOpacity={0.85}
                              onPress={() =>
                                addToCart({
                                  ...pi,
                                  qty: 1,
                                  restaurant: group.restaurant,
                                  restaurantId: group.restaurantId,
                                  restaurantName: group.restaurantName,
                                })
                              }
                            >
                              <Text style={styles.popularAddText}>ADD</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {hasItems && (
        <View style={styles.bottomBarCompact}>
          <View>
            <Text style={styles.bottomTotal}>₹{grandTotal.toFixed(2)}</Text>
            <Text style={styles.bottomSub}>Total Price</Text>
          </View>
          <TouchableOpacity
            style={styles.reviewBtn}
            activeOpacity={0.9}
            onPress={() => {
              if (rootNav?.navigate) rootNav.navigate('ReviewOrderScreen');
              else navigation.navigate('ReviewOrderScreen');
            }}
          >
            <Text style={styles.reviewBtnText}>Review Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  scroll: { padding: 16, paddingBottom: 140 },

  emptyWrap: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  emptySub: { marginTop: 8, color: '#777', fontWeight: '600' },

  deliveryCard: {
    backgroundColor: '#FDEEEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  deliveryLabel: { fontSize: 11, color: '#666', fontWeight: '700' },
  deliveryValue: { marginTop: 2, fontSize: 12, fontWeight: '800' },
  deliveryChange: { marginTop: 2 },
  deliveryChangeText: { color: '#E53935', fontSize: 11, fontWeight: '800' },

  group: { marginBottom: 16 },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantName: { fontSize: 14, fontWeight: '900', color: '#111' },
  restaurantMeta: { fontSize: 11, color: '#777', marginTop: 2 },
  restaurantArrow: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantArrowText: { fontSize: 18, color: '#777' },

  offerBox: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  offerTitle: { fontWeight: '900', color: '#111', marginBottom: 6 },
  offerText: { color: '#E53935', fontWeight: '800', marginTop: 2 },

  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  qtyOverlay: {
    position: 'absolute',
    right: 12,
    top: 10,
  },
  itemImg: { width: 56, height: 56, borderRadius: 12, marginRight: 12 },
  itemName: { fontWeight: '900', color: '#111', fontSize: 13 },
  itemSubtitle: {
    marginTop: 2,
    color: '#555',
    fontWeight: '700',
    fontSize: 11,
  },
  itemEdit: { marginTop: 2 },
  itemEditText: { color: '#E53935', fontWeight: '800', fontSize: 11 },
  itemOptions: { marginTop: 4, color: '#666', fontWeight: '700', fontSize: 11 },
  itemNotes: { marginTop: 4, color: '#777', fontWeight: '600', fontSize: 11 },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 10,
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#FFECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    width: 20,
    textAlign: 'center',
    fontWeight: '900',
    color: '#E53935',
  },
  itemPrice: { marginLeft: 10, fontWeight: '900', color: '#111' },
  trashBtn: { marginLeft: 10, padding: 6 },

  itemTotalsRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTotalsText: {
    fontSize: 11,
    color: '#777',
    fontWeight: '700',
  },

  addMore: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#E53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMoreText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

  sectionTitle: {
    marginTop: 12,
    fontWeight: '900',
    color: '#111',
  },

  couponCard: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponTitle: { fontSize: 12, fontWeight: '700', color: '#111' },
  couponCodeWrap: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E53935',
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  couponCode: {
    color: '#E53935',
    fontWeight: '900',
    fontSize: 12,
  },
  couponApply: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  couponApplyText: { fontWeight: '800', fontSize: 12, color: '#111' },
  couponApplied: {
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFECEC',
  },
  couponAppliedText: { fontWeight: '800', fontSize: 12, color: '#E53935' },

  viewCoupons: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  viewCouponsText: { fontWeight: '800', color: '#111' },
  viewCouponsArrow: { fontSize: 18, color: '#777' },

  billBox: {
    marginTop: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  billTitle: { fontWeight: '900', color: '#111', marginBottom: 8 },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    borderBottomWidth:1,
    padding:4,
    borderColor:"#D9D9D9"
  },
  billLabel: { color: '#777', fontWeight: '700' },
  billValue: { color: '#111', fontWeight: '900' },
  billFree: { color: '#E53935', fontWeight: '900' },
  billDiscount: { color: '#E53935', fontWeight: '900' },
  billDivider: { height: 1, backgroundColor: '#EEE', marginVertical: 8 },
  billTotal: { color: '#111', fontWeight: '900', fontSize: 14 },

  popularBox: {
    marginTop: 12,
  },
  popularTitle: { fontWeight: '900', color: '#111', marginBottom: 8 },
  popularList: { paddingRight: 6 },
  popularCard: {
    width: 120,
    marginRight: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  popularImg: { width: '100%', height: 70, borderRadius: 10 },
  popularName: { marginTop: 6, fontWeight: '800', color: '#111', fontSize: 12 },
  popularSub: { fontSize: 10, color: '#777', marginTop: 2 },
  popularPrice: {
    marginTop: 4,
    color: '#111',
    fontWeight: '900',
    fontSize: 12,
  },
  popularAdd: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: 10,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularAddText: { color: '#E53935', fontWeight: '900', fontSize: 11 },

  bottomBarCompact: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomTotal: { fontSize: 16, fontWeight: '900', color: '#111' },
  bottomSub: { fontSize: 11, color: '#777', fontWeight: '700' },
  reviewBtn: {
    backgroundColor: '#FF3D3D',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
});
