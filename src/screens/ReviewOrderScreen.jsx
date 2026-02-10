import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { CartContext } from '../context/CartContext';
import { generateOrderId, placeOrder } from '../services/orderService';
import { toNumber } from '../services/cartPricing';
import { CART_ROUTES } from '../config/routes';
import apiClient from '../config/apiClient';
import {
  addAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from '../services/addressService';
import OrderConfirmedModal from '../components/OrderConfirmedModal';
import DeliveryPickupSheet from '../components/DeliveryPickupSheet';
import AddressSheet from '../components/AddressSheet';
import PaymentMethodSheet from '../components/PaymentMethodSheet';
import { wp, hp } from '../utils/responsive';
import { scale } from '../utils/scale';
import { FONT_SIZES } from '../theme/typography';
import { SPACING } from '../theme/spacing';

export default function ReviewOrderScreen() {
  const navigation = useNavigation();
  const {
    cart,
    totals,
    addOrder,
    checkout,
    setCheckout,
    address,
    setAddress,
    paymentMethod,
    setPaymentMethod,
    fetchCart,
  } = useContext(CartContext);

  const [activeSheet, setActiveSheet] = useState(null); // 'delivery' | 'address' | 'payment' | null

  const [deliveryNextStep, setDeliveryNextStep] = useState(null); // null | 'address'

  const [sheetBackTarget, setSheetBackTarget] = useState({
    address: null,
    payment: null,
  });

  const [showModal, setShowModal] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [tipAmount, setTipAmount] = useState(0); // 0 | 5 | 10 | 20
  const [tipLoading, setTipLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const placeOrderTimerRef = useRef(null);

  const latestCartRef = useRef(cart);
  latestCartRef.current = cart;

  const latestCheckoutRef = useRef(checkout);
  latestCheckoutRef.current = checkout;

  const latestAddressRef = useRef(address);
  latestAddressRef.current = address;

  const latestPaymentMethodRef = useRef(paymentMethod);
  latestPaymentMethodRef.current = paymentMethod;

  const isAnySheetVisible = activeSheet !== null;

  const [addresses, setAddresses] = useState([]);

  const summary = useMemo(() => {
    const subtotal = toNumber(totals?.subtotal, 0);
    const deliveryFee = toNumber(totals?.delivery, 0);
    const tax = toNumber(totals?.tax, 0);
    const platformFee = toNumber(totals?.platformFee, 0);
    const packaging = toNumber(totals?.packaging, 0);
    const smallCartFee = toNumber(totals?.smallCartFee, 0);
    const discount = toNumber(totals?.discount, 0);
    const totalBeforeTip = subtotal + deliveryFee + tax + platformFee + packaging + smallCartFee - discount;
    const grandTotal = Math.max(0, totalBeforeTip + tipAmount);
    
    return {
      subtotal,
      delivery: deliveryFee,
      tax,
      serviceFee: platformFee,
      packaging,
      smallCartFee,
      discount,
      tip: tipAmount,
      totalBeforeTip,
      grandTotal,
    };
  }, [totals, tipAmount]);

  useEffect(() => {
    return () => {
      if (placeOrderTimerRef.current) {
        clearTimeout(placeOrderTimerRef.current);
        placeOrderTimerRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', e => {
        if (!showModal && !isAnySheetVisible && !isPlacing) return;
        e.preventDefault();
      });

      return unsubscribe;
    }, [navigation, showModal, isAnySheetVisible, isPlacing]),
  );

  const normalizeAddress = useCallback(addr => {
    if (!addr) return null;
    return {
      id: addr._id || addr.id,
      label: addr.label,
      addressLine: addr.addressLine,
      city: addr.city,
      zipCode: addr.zipCode,
      location: addr.location,
      deliveryInstructions: addr.deliveryInstructions,
      isDefault: !!addr.isDefault,
    };
  }, []);

  const applyAddressList = useCallback(
    data => {
      const list = (data?.addresses || [])
        .map(normalizeAddress)
        .filter(Boolean);
      setAddresses(list);

      if (!address?.id && list.length > 0) {
        const defaultAddr = list.find(a => a.isDefault) || list[0];
        if (defaultAddr) setAddress(defaultAddr);
      }

      return list;
    },
    [address?.id, normalizeAddress, setAddress],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadAddresses = async () => {
        try {
          const response = await getAddresses();
          if (active) applyAddressList(response);
        } catch (error) {
          console.error('Address fetch failed:', error?.message);
        }
      };

      loadAddresses();
      return () => {
        active = false;
      };
    }, [applyAddressList]),
  );

  const handleUpdateTip = useCallback(async (newTipAmount) => {
    setTipLoading(true);
    try {
      const response = await apiClient.put(CART_ROUTES.updateMeta, {
        tip: newTipAmount,
      });
      
      if (response?.data?.bill) {
        setTipAmount(response.data.bill.tip ?? newTipAmount);
        console.log('✅ Tip updated successfully:', response.data.bill.tip);
      } else {
        setTipAmount(newTipAmount);
      }
    } catch (error) {
      console.error('❌ Failed to update tip:', error?.message);
      // Fallback: still update local state
      setTipAmount(newTipAmount);
    } finally {
      setTipLoading(false);
    }
  }, []);

  const openCheckoutStep = step => {
    setActiveSheet(step);
  };

  const handlePlaceOrderPress = () => {
    if (isPlacing || !latestCartRef.current?.length) return;

    const newErrors = {};
    let isValid = true;

    if (!latestCheckoutRef.current?.type) {
      newErrors.checkout = 'Please select pick-up or delivery type';
      isValid = false;
    }

    if (!latestAddressRef.current?.id) {
      newErrors.address = 'Please select a delivery address';
      isValid = false;
    }

    if (!latestPaymentMethodRef.current?.id) {
      newErrors.payment = 'Please select a payment method';
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    if (placeOrderTimerRef.current) {
      clearTimeout(placeOrderTimerRef.current);
    }

    placeOrderTimerRef.current = setTimeout(() => {
      handleFinalizeOrder();
    }, 300);
  };

  const handleFinalizeOrder = async finalPaymentMethod => {
    if (isPlacing || !latestCartRef.current?.length) return;
    setIsPlacing(true);

    // Clear any previous submit errors
    setErrors(prev => {
      const { submit, ...rest } = prev;
      return rest;
    });

    const checkoutSnapshot = latestCheckoutRef.current;
    const addressSnapshot = latestAddressRef.current;
    const paymentSnapshot =
      finalPaymentMethod ?? latestPaymentMethodRef.current;

    const paymentCode =
      paymentSnapshot?.id || paymentSnapshot?.code || paymentSnapshot?.value || 'cod';

    const orderPayload = {
      addressId: addressSnapshot?.id,
      paymentMethod: paymentCode,
    };

    let newOrderId = generateOrderId('FP');

    try {
      const response = await placeOrder(orderPayload);
      const apiOrder = response?.order || null;
      if (apiOrder?._id) {
        newOrderId = apiOrder._id;
        addOrder({
          ...apiOrder,
          id: apiOrder._id,
          totals: summary,
          checkout: checkoutSnapshot,
          address: addressSnapshot,
          paymentMethod: paymentSnapshot,
          leaveAtDoor,
        });
      } else {
        addOrder({
          id: newOrderId,
          totals: summary,
          checkout: checkoutSnapshot,
          address: addressSnapshot,
          paymentMethod: paymentSnapshot,
          leaveAtDoor,
          createdAt: new Date().toISOString(),
          status: 'confirmed',
          items: latestCartRef.current,
        });
      }
    } catch (error) {
      console.log('Order API failed, falling back to local confirmation', error);
      addOrder({
        id: newOrderId,
        totals: summary,
        checkout: checkoutSnapshot,
        address: addressSnapshot,
        paymentMethod: paymentSnapshot,
        leaveAtDoor,
        createdAt: new Date().toISOString(),
        status: 'confirmed',
        items: latestCartRef.current,
      });
    } finally {
      
      await fetchCart();
      setOrderId(newOrderId);
      setShowModal(true);
      setIsPlacing(false);
    }
  };

  const addressOptions = useMemo(() => addresses, [addresses]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.sectionCard}>
          <Pressable
            style={styles.sectionTitleRow}
            onPress={() => {
              setSheetBackTarget(prev => ({ ...prev, address: null }));
              setActiveSheet('address');
            }}
          >
            <Text style={styles.sectionTitle}>Delivering Address</Text>
            <ChevronRight size={18} color="#999" />
          </Pressable>

          <Pressable
            style={styles.addressRow}
            onPress={() => {
              setSheetBackTarget(prev => ({ ...prev, address: null }));
              setActiveSheet('address');
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.addressLabel}>
                {address?.label || 'Home'}
              </Text>
              <Text style={styles.addressLine} numberOfLines={2}>
                {address?.addressLine ||
                  'Jetty 4, Opp. Old Iron Bridge, Kashmere Gate, New Delhi - 110006'}
              </Text>
            </View>
          </Pressable>

          <View style={styles.leaveRow}>
            <Text style={styles.leaveText}>Leave at the door</Text>
            <Switch
              value={leaveAtDoor}
              onValueChange={setLeaveAtDoor}
              trackColor={{ false: '#D9D9D9', true: '#D9D9D9' }}
              thumbColor={leaveAtDoor ? '#111' : '#FFF'}
            />
          </View>
          {errors.address && (
            <Text style={styles.errorText}>{errors.address}</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tip your rider</Text>

          <Text style={styles.tipSub}>
            100% of the tips go to your rider, we dont deduct anything from it
          </Text>

          <View style={styles.tipRow}>
            {[0, 5, 10, 20].map(v => {
              const selected = tipAmount === v;
              const label = v === 0 ? 'Not Now' : `₹${v}.00`;
              return (
                <Pressable
                  key={String(v)}
                  onPress={() => handleUpdateTip(v)}
                  disabled={tipLoading}
                  style={[styles.tipChip, selected && styles.tipChipActive]}
                >
                  {tipLoading && selected ? (
                    <ActivityIndicator size="small" color={selected ? '#FFF' : '#111'} />
                  ) : (
                    <Text
                      style={[
                        styles.tipChipText,
                        selected && styles.tipChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Pressable
            style={styles.sectionTitleRow}
            onPress={() => {
              setSheetBackTarget(prev => ({ ...prev, payment: null }));
              setActiveSheet('payment');
            }}
          >
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <ChevronRight size={18} color="#999" />
          </Pressable>
          <Pressable
            onPress={() => {
              setSheetBackTarget(prev => ({ ...prev, payment: null }));
              setActiveSheet('payment');
            }}
          >
            <Text style={styles.paymentValue}>
              {paymentMethod?.label || 'Credit Card'}
            </Text>
          </Pressable>
          {errors.payment && (
            <Text style={styles.errorText}>{errors.payment}</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>₹{summary.subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={summary.delivery > 0 ? styles.billValue : styles.billFree}>
              {summary.delivery > 0 ? `₹${summary.delivery.toFixed(2)}` : 'Free'}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tax</Text>
            <Text style={styles.billValue}>₹{summary.tax.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Packaging</Text>
            <Text style={styles.billValue}>₹{summary.packaging.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Service Fee</Text>
            <Text style={styles.billValue}>₹{summary.serviceFee.toFixed(2)}</Text>
          </View>

          {summary.smallCartFee > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Small Cart Fee</Text>
              <Text style={styles.billValue}>₹{summary.smallCartFee.toFixed(2)}</Text>
            </View>
          )}

          {summary.discount > 0 && (
            <View style={styles.billRow}>
              <View>
                <Text style={styles.billLabel}>Offer Applied</Text>
                <Text style={styles.offerSub}>Discount</Text>
              </View>
              <Text style={styles.offerValue}>-₹{summary.discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.dashedLine} />

          <View style={[styles.billRow, styles.billRowStrong]}>
            <Text style={styles.billStrong}>Total Before Tip</Text>
            <Text style={styles.billStrong}>₹{summary.totalBeforeTip.toFixed(2)}</Text>
          </View>

          {summary.tip > 0 && (
            <View style={[styles.billRow, styles.tipRowHighlight]}>
              <Text style={styles.tipLabel}>Tip for Rider</Text>
              <Text style={styles.tipValue}>₹{summary.tip.toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.billRow, styles.billRowFinal]}>
            <Text style={styles.billFinal}>Grand Total</Text>
            <Text style={styles.billFinal}>₹{summary.grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.termsText}>
          By completing this order, I agree to all{' '}
          <Text
            style={styles.termsLink}
            onPress={() => {
              // optional: route to your Terms screen
            }}
          >
            terms & condition
          </Text>
        </Text>

        <View style={{ height: 140 }} />
      </ScrollView>

      {errors.submit && (
        <View style={styles.submitErrorContainer}>
          <Text style={styles.submitErrorText}>{errors.submit}</Text>
        </View>
      )}

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomTotal}>
            ₹{summary.grandTotal.toFixed(2)}
          </Text>
          <Text style={styles.bottomSub}>Total Price</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.placeOrderBtn,
            pressed && styles.placeOrderPressed,
          ]}
          onPress={handlePlaceOrderPress}
        >
          {isPlacing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </Pressable>
      </SafeAreaView>

      <DeliveryPickupSheet
        visible={activeSheet === 'delivery'}
        initialType={checkout?.type || 'delivery'}
        initialDate={checkout?.date || null}
        initialTime={checkout?.time || null}
        onClose={() => {
          setActiveSheet(null);
          setDeliveryNextStep(null);
        }}
        onAdd={payload => {
          setCheckout(payload);
          setSheetBackTarget({ address: 'delivery', payment: 'address' });
          if (deliveryNextStep === 'address') {
            setActiveSheet('address');
          } else {
            setActiveSheet(null);
          }
          setDeliveryNextStep(null);
        }}
      />

      <AddressSheet
        visible={activeSheet === 'address'}
        addresses={addressOptions}
        selectedAddressId={address?.id || null}
        onSelect={addr => setAddress(addr)}
        onApply={addr => {
          setAddress(addr);
          setSheetBackTarget(prev => ({ ...prev, payment: 'address' }));
          setActiveSheet('payment');
        }}
        onAddAddress={async payload => {
          const response = await addAddress(payload);
          return applyAddressList(response);
        }}
        onUpdateAddress={async (id, payload) => {
          const response = await updateAddress(id, payload);
          return applyAddressList(response);
        }}
        onDeleteAddress={async id => {
          const response = await deleteAddress(id);
          return applyAddressList(response);
        }}
        onClose={() =>
          setActiveSheet(
            sheetBackTarget.address ? sheetBackTarget.address : null,
          )
        }
      />
   
      <PaymentMethodSheet
        visible={activeSheet === 'payment'}
        selectedId={paymentMethod?.id || null}
        onClose={() =>
          setActiveSheet(
            sheetBackTarget.payment ? sheetBackTarget.payment : null,
          )
        }
        onApply={method => {
          setPaymentMethod(method);
          setActiveSheet(null);
        }}
      />

      <OrderConfirmedModal
        visible={showModal}
        orderId={orderId}
        onViewDetails={() => {
          setShowModal(false);
          navigation.navigate('OrderDetailsScreen', { orderId });
        }}
        onExploreMenu={() => {
          setShowModal(false);
          navigation.navigate('MainTabs', { screen: 'Home' });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },

  /* ---------- HEADER ---------- */
  header: {
    height: hp(7),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: scale(32),
    height: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#111',
  },
  headerRightSpace: { width: scale(32) },

  scroll: {
    paddingBottom: hp(18),
  },

  /* ---------- SECTIONS ---------- */
  sectionCard: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#111',
  },

  /* ---------- DELIVERY ---------- */
  deliveryValue: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#111',
  },
  deliverySub: {
    marginTop: scale(2),
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '500',
    color: '#777',
  },

  /* ---------- ADDRESS ---------- */
  addressRow: {
    marginTop: SPACING.sm,
  },
  addressLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#111',
  },
  addressLine: {
    marginTop: scale(4),
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '500',
    color: '#666',
    lineHeight: scale(15),
  },

  leaveRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#111',
  },

  /* ---------- TIP ---------- */
  tipSub: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '500',
    color: '#777',
    lineHeight: scale(15),
  },

  tipRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },

  tipChip: {
    height: scale(30),
    paddingHorizontal: scale(14),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },

  tipChipActive: {
    backgroundColor: '#FF3D3D',
    borderColor: '#FF3D3D',
  },

  tipChipText: {
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '700',
    color: '#111',
  },

  tipChipTextActive: {
    color: '#FFF',
  },

  /* ---------- PAYMENT ---------- */
  paymentValue: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#111',
  },

  /* ---------- BILL ---------- */
  billRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  billLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#555',
  },

  billValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#111',
  },

  billFree: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#E53935',
  },

  offerSub: {
    marginTop: scale(2),
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '700',
    color: '#FF3D3D',
  },

  offerValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#FF3D3D',
  },

  dashedLine: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DDD',
  },

  billRowStrong: {
    marginTop: SPACING.md,
  },

  billStrong: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: '#111',
  },

  tipRowHighlight: {
    marginTop: SPACING.sm,
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    backgroundColor: '#FFF5F5',
    borderRadius: scale(8),
    borderLeftWidth: scale(3),
    borderLeftColor: '#FF3D3D',
  },

  tipLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#FF3D3D',
  },

  tipValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#FF3D3D',
  },

  billRowFinal: {
    marginTop: SPACING.md,
    paddingVertical: scale(6),
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#111',
    borderRadius: scale(8),
  },

  billFinal: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: '#FFF',
  },

  /* ---------- TERMS ---------- */
  termsText: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '500',
    color: '#666',
    lineHeight: scale(15),
  },

  termsLink: {
    color: '#FF3D3D',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  /* ---------- BOTTOM BAR ---------- */
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },

  bottomLeft: {},
  bottomTotal: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: '#111',
  },
  bottomSub: {
    marginTop: scale(2),
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: '500',
    color: '#777',
  },

  placeOrderBtn: {
    flex: 1,
    height: scale(44),
    borderRadius: scale(12),
    backgroundColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeOrderText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: '#FFF',
  },

  placeOrderPressed: {
    opacity: 0.9,
  },

  submitErrorContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    backgroundColor: '#FFF',
  },

  submitErrorText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#FF3D3D',
    textAlign: 'center',
  },
  errorText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#FF3D3D',
  },
});
