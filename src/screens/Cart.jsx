import React, { useContext, useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { CartContext } from '../context/CartContext';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import AddToCartDrawer from '../components/AddToCartDrawer';
import { RefreshableWrapper } from '../components/RefreshableWrapper';
import { toNumber } from '../services/cartPricing';
import { wp, hp } from '../utils/responsive';
import { scale } from '../utils/scale';
import { FONT_SIZES } from '../theme/typography';
import { SPACING } from '../theme/spacing';

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

const CartItemRow = React.memo(function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onDelete,
  onEdit,
  isDeleting,
}) {
  const itemId = item?.id ?? item?.menuItemId ?? item?.productId;
  const imageSource =
    item?.image && typeof item.image === 'string' && item.image.trim()
      ? { uri: item.image }
      : require('../assets/images/Food.png');
  const optionsLine = formatOptionsLine(item);

  return (
    <View style={styles.itemCard}>
      <Image source={imageSource} style={styles.itemImg} />

      <View style={styles.qtyOverlay} pointerEvents="box-none">
        <View style={styles.qtyWrap}>
          <Pressable
            onPress={() => onDecrement?.(itemId)}
            style={styles.qtyBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Minus size={14} color="#E53935" />
          </Pressable>

          <Text style={styles.qtyText}>{toNumber(item?.quantity, 1)}</Text>

          <Pressable
            onPress={() => onIncrement?.(itemId)}
            style={styles.qtyBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Plus size={14} color="#E53935" />
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={styles.itemName}>
          {item?.name}
        </Text>
        <Text style={styles.itemSubtitle}>Original</Text>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {!!optionsLine && (
            <Text numberOfLines={2} style={styles.itemOptions}>
              {optionsLine}
            </Text>
          )}

          <View style={styles.itemBottomRow}>
            <Text style={styles.itemPrice}>
              ₹{toNumber(item?.totalPrice, 0)}
            </Text>

            <TouchableOpacity
              onPress={() => onDelete?.(itemId, item?.name)}
              style={[styles.trashBtn, isDeleting && styles.trashBtnDeleting]}
              activeOpacity={0.85}
              disabled={isDeleting}
            >
              <Trash2 size={16} color={isDeleting ? '#CCC' : '#777'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemTotalsRow}>
          <Text style={styles.itemTotalsText}>
            Items Count : {toNumber(item?.quantity, 1)}
          </Text>
          <Text style={styles.itemTotalsText}>
            Total Price : ₹{toNumber(item?.totalPrice, 0)}
          </Text>
        </View>
      </View>
    </View>
  );
});

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

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [deleteItemName, setDeleteItemName] = useState('');
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const groups = useMemo(() => groupByRestaurant(cart), [cart]);
  const hasItems = Array.isArray(cart) && cart.length > 0;

  const handleIncrement = useCallback(
    id => incrementItem?.(id),
    [incrementItem],
  );

  const handleDecrement = useCallback(
    id => decrementItem?.(id),
    [decrementItem],
  );

  const handleDeleteItem = (itemId, itemName) => {
    setDeletingItemId(itemId);
    setDeleteItemName(itemName);
    setDeleteModalVisible(true);
  };

  const handleDelete = useCallback(
    (itemId, itemName) => handleDeleteItem(itemId, itemName),
    [],
  );

  const handleEdit = useCallback((item) => {
    setSelectedItem({
      id: item.menuItemId || item.productId || item.id,
      name: item.name,
      image: item.image,
      price: item.basePrice || item.price,
      basePrice: item.basePrice || item.price,
      description: item.description || '',
      variations: item.variations || [],
      addOns: item.addOns || [],
      flavors: item.selectedFlavor ? [item.selectedFlavor] : [],
    });
    setSelectedRestaurant(item.restaurant || {
      id: item.restaurantId,
      _id: item.restaurantId,
      name: item.restaurantName,
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedItem(null);
    setSelectedRestaurant(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingItemId) return;

    try {
      setIsDeletingItem(true);
      console.log('🗑️ Cart: Deleting item:', deleteItemName);
      await removeFromCart(deletingItemId);
      console.log('✅ Cart: Item deleted successfully');
      setDeleteModalVisible(false);
      setDeletingItemId(null);
      setDeleteItemName('');
    } catch (error) {
      console.error('❌ Cart: Error deleting item:', error?.message);
    } finally {
      setIsDeletingItem(false);
    }
  }, [deletingItemId, deleteItemName, removeFromCart]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
    setDeletingItemId(null);
    setDeleteItemName('');
  }, []);

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

  const delivery = toNumber(totals?.delivery, 0);
  const tax = toNumber(totals?.tax, 0);
  const subtotal = toNumber(totals?.subtotal, 0);
  const platformFee = toNumber(totals?.platformFee, 0);
  const packaging = toNumber(totals?.packaging, 0);
  const smallCartFee = toNumber(totals?.smallCartFee, 0);
  const appliedCoupon = coupons.find(c => c.id === appliedCouponId) || null;
  const discount = appliedCoupon ? Math.min(appliedCoupon.amount, subtotal) : 0;
  const totalBeforeTax = subtotal + delivery + packaging + smallCartFee - discount + platformFee;
  const grandTotal = Math.max(0, totalBeforeTax + tax);
  const estimatedDelivery = 'Standard (20-35 minutes)';

  const handleRefresh = async () => {
    console.log('Cart refreshed');
  };

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

      <RefreshableWrapper
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onRefresh={handleRefresh}
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
              {/* <TouchableOpacity style={styles.deliveryChange}>
                <Text style={styles.deliveryChangeText}>Change</Text>
              </TouchableOpacity> */}
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
                    {/* <TouchableOpacity style={styles.restaurantArrow}>
                      <Text style={styles.restaurantArrowText}>›</Text>
                    </TouchableOpacity> */}
                  </View>

                  {group.items.map(ci => {
                    const itemId = ci?.id ?? ci?.menuItemId ?? ci?.productId ?? ci?.name;
                    return (
                      <CartItemRow
                        key={String(itemId)}
                        item={ci}
                        onIncrement={handleIncrement}
                        onDecrement={handleDecrement}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        isDeleting={
                          String(deletingItemId ?? '') === String(itemId ?? '')
                        }
                      />
                    );
                  })}

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
                      <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
                    </View>

                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Delivery Fee</Text>
                      <Text style={delivery > 0 ? styles.billValue : styles.billFree}>
                        {delivery > 0 ? `₹${delivery.toFixed(2)}` : 'Free'}
                      </Text>
                    </View>

                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Tax</Text>
                      <Text style={styles.billValue}>₹{tax.toFixed(2)}</Text>
                    </View>

                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Packaging</Text>
                      <Text style={styles.billValue}>₹{packaging.toFixed(2)}</Text>
                    </View>

                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Service Fee</Text>
                      <Text style={styles.billValue}>₹{platformFee.toFixed(2)}</Text>
                    </View>

                    {smallCartFee > 0 && (
                      <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Small Cart Fee</Text>
                        <Text style={styles.billValue}>₹{smallCartFee.toFixed(2)}</Text>
                      </View>
                    )}

                    {discount > 0 && (
                      <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Offer Applied</Text>
                        <Text style={styles.billDiscount}>-₹{discount.toFixed(2)}</Text>
                      </View>
                    )}

                    <View style={styles.billDivider} />

                    <View style={styles.billRow}>
                      <Text style={styles.billTotal}>Grand Total</Text>
                      <Text style={styles.billTotal}>₹{grandTotal.toFixed(2)}</Text>
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
      </RefreshableWrapper>

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
              navigation.navigate('ReviewOrderScreen');
            }}
          >
            <Text style={styles.reviewBtnText}>Review Order</Text>
          </TouchableOpacity>
        </View>
      )}

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        itemName={deleteItemName}
        isDeleting={isDeletingItem}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {selectedItem && selectedRestaurant && (
        <AddToCartDrawer
          visible={!!selectedItem}
          item={selectedItem}
          restaurant={selectedRestaurant}
          onClose={closeDrawer}
          currencySymbol="₹"
          onAddToCart={closeDrawer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerBack: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: '#111' },
  scroll: { padding: SPACING.lg, paddingBottom: scale(140) },

  emptyWrap: {
    paddingVertical: scale(36),
    alignItems: 'center',
  },
  emptyTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: '#111' },
  emptySub: { marginTop: SPACING.sm, color: '#777', fontWeight: '600' },

  deliveryCard: {
    backgroundColor: '#FDEEEE',
    borderRadius: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  deliveryLabel: { fontSize: FONT_SIZES.xs, color: '#666', fontWeight: '700' },
  deliveryValue: { marginTop: scale(2), fontSize: FONT_SIZES.xs, fontWeight: '800' },
  deliveryChange: { marginTop: scale(2) },
  deliveryChangeText: { color: '#E53935', fontSize: FONT_SIZES.xs, fontWeight: '800' },

  group: { marginBottom: SPACING.lg },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantName: { fontSize: FONT_SIZES.xs, fontWeight: '900', color: '#111' },
  restaurantMeta: { fontSize: FONT_SIZES.xs, color: '#777', marginTop: scale(2) },
  restaurantArrow: {
    width: scale(26),
    height: scale(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantArrowText: { fontSize: FONT_SIZES.md, color: '#777' },

  offerBox: {
    marginTop: scale(10),
    backgroundColor: '#FFF',
    borderRadius: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  offerTitle: { fontWeight: '900', color: '#111', marginBottom: scale(6) },
  offerText: { color: '#E53935', fontWeight: '800', marginTop: scale(2) },

  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: scale(16),
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  qtyOverlay: {
    position: 'absolute',
    right: SPACING.md,
    top: scale(10),
    zIndex: 5,
    elevation: 5,
  },
  itemImg: { width: scale(56), height: scale(56), borderRadius: SPACING.md, marginRight: SPACING.md },
  itemName: { fontWeight: '900', color: '#111', fontSize: FONT_SIZES.xs },
  itemSubtitle: {
    marginTop: scale(2),
    color: '#555',
    fontWeight: '700',
    fontSize: FONT_SIZES.xs,
  },
  itemEdit: { marginTop: scale(2) },
  itemEditText: { color: '#E53935', fontWeight: '800', fontSize: FONT_SIZES.xs },
  itemOptions: { marginTop: SPACING.xs, color: '#666', fontWeight: '700', fontSize: FONT_SIZES.xs },
  itemNotes: { marginTop: SPACING.xs, color: '#777', fontWeight: '600', fontSize: FONT_SIZES.xs },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 10,
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingHorizontal: SPACING.xs,
    paddingVertical: scale(2),
  },
  qtyBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(6),
    backgroundColor: '#FFECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    minWidth: scale(24),
    textAlign: 'center',
    fontWeight: '900',
    color: '#E53935',
    fontSize: FONT_SIZES.xs,
  },
  itemPrice: { marginLeft: scale(10), fontWeight: '900', color: '#111' },
  trashBtn: { marginLeft: scale(10), padding: scale(6) },
  trashBtnDeleting: { opacity: 0.5 },

  itemTotalsRow: {
    marginTop: scale(6),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTotalsText: {
    fontSize: FONT_SIZES.xs,
    color: '#777',
    fontWeight: '700',
  },

  addMore: {
    marginTop: scale(10),
    alignSelf: 'flex-start',
    backgroundColor: '#E53935',
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(6),
    borderRadius: scale(8),
  },
  addMoreText: { color: '#FFF', fontWeight: '800', fontSize: FONT_SIZES.xs },

  sectionTitle: {
    marginTop: SPACING.md,
    fontWeight: '900',
    color: '#111',
  },

  couponCard: {
    marginTop: scale(10),
    backgroundColor: '#FFF',
    borderRadius: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  couponTitle: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#111' },
  couponCodeWrap: {
    marginTop: scale(6),
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E53935',
    borderStyle: 'dashed',
    borderRadius: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
  },
  couponCode: {
    color: '#E53935',
    fontWeight: '900',
    fontSize: FONT_SIZES.xs,
  },
  couponApply: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale(8),
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(6),
  },
  couponApplyText: { fontWeight: '800', fontSize: FONT_SIZES.xs, color: '#111' },
  couponApplied: {
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: scale(8),
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(6),
    backgroundColor: '#FFECEC',
  },
  couponAppliedText: { fontWeight: '800', fontSize: FONT_SIZES.xs, color: '#E53935' },

  viewCoupons: {
    marginTop: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  viewCouponsText: { fontWeight: '800', color: '#111' },
  viewCouponsArrow: { fontSize: FONT_SIZES.md, color: '#777' },

  billBox: {
    marginTop: SPACING.md,
    backgroundColor: '#FFF',
    borderRadius: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  billTitle: { fontWeight: '900', color: '#111', marginBottom: SPACING.sm },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(6),
    borderBottomWidth: 1,
    padding: scale(4),
    borderColor: '#D9D9D9',
  },
  billLabel: { color: '#777', fontWeight: '700' },
  billValue: { color: '#111', fontWeight: '900' },
  billFree: { color: '#E53935', fontWeight: '900' },
  billDiscount: { color: '#E53935', fontWeight: '900' },
  billDivider: { height: 1, backgroundColor: '#EEE', marginVertical: SPACING.sm },
  billTotal: { color: '#111', fontWeight: '900', fontSize: FONT_SIZES.xs },

  popularBox: {
    marginTop: SPACING.md,
  },
  popularTitle: { fontWeight: '900', color: '#111', marginBottom: SPACING.sm },
  popularList: { paddingRight: scale(6) },
  popularCard: {
    width: wp(32),
    marginRight: scale(10),
    backgroundColor: '#FFF',
    borderRadius: SPACING.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  popularImg: { width: '100%', height: scale(70), borderRadius: scale(10) },
  popularName: { marginTop: scale(6), fontWeight: '800', color: '#111', fontSize: FONT_SIZES.xs },
  popularSub: { fontSize: FONT_SIZES.xs, color: '#777', marginTop: scale(2) },
  popularPrice: {
    marginTop: scale(4),
    color: '#111',
    fontWeight: '900',
    fontSize: FONT_SIZES.xs,
  },
  popularAdd: {
    marginTop: scale(6),
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: scale(10),
    height: scale(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularAddText: { color: '#E53935', fontWeight: '900', fontSize: FONT_SIZES.xs },

  bottomBarCompact: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomTotal: { fontSize: FONT_SIZES.sm, fontWeight: '900', color: '#111' },
  bottomSub: { fontSize: FONT_SIZES.xs, color: '#777', fontWeight: '700' },
  reviewBtn: {
    backgroundColor: '#FF3D3D',
    borderRadius: scale(14),
    paddingHorizontal: SPACING.lg,
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBtnText: { color: '#FFF', fontWeight: '900', fontSize: FONT_SIZES.xs },
});
