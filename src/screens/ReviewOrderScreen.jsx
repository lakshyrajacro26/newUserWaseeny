import React, { useContext, useMemo, useRef, useState } from 'react';
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
import OrderConfirmedModal from '../components/OrderConfirmedModal';
import DeliveryPickupSheet from '../components/DeliveryPickupSheet';
import AddressSheet from '../components/AddressSheet';
import PaymentMethodSheet from '../components/PaymentMethodSheet';

export default function ReviewOrderScreen() {
  const navigation = useNavigation();
  const {
    cart,
    totals,
    addOrder,
    clearCart,
    checkout,
    setCheckout,
    address,
    setAddress,
    paymentMethod,
    setPaymentMethod,
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
  const [errors, setErrors] = useState({});

  const latestCartRef = useRef(cart);
  latestCartRef.current = cart;

  const latestCheckoutRef = useRef(checkout);
  latestCheckoutRef.current = checkout;

  const latestAddressRef = useRef(address);
  latestAddressRef.current = address;

  const latestPaymentMethodRef = useRef(paymentMethod);
  latestPaymentMethodRef.current = paymentMethod;

  const isAnySheetVisible = activeSheet !== null;

  const [addressBook, setAddressBook] = useState(() => [
    {
      id: 'addr_home',
      label: 'Home',
      addressLine: 'Amsterdam St, 4301 Lucena, Lucena Quezon',
    },
    {
      id: 'addr_work',
      label: 'Work',
      addressLine: '2nd Floor, City Center, Main Road',
    },
  ]);

  const summary = useMemo(() => {
    const subtotal = toNumber(totals?.subtotal, 0);
    const serviceFee = 5;
    const discount = 20;
    return {
      subtotal,
      delivery: 0,
      tax: 0,
      serviceFee,
      discount,
      tip: tipAmount,
      grandTotal: Math.max(0, subtotal + serviceFee - discount + tipAmount),
    };
  }, [totals, tipAmount]);

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', e => {
        if (!showModal && !isAnySheetVisible && !isPlacing) return;
        e.preventDefault();
      });

      return unsubscribe;
    }, [navigation, showModal, isAnySheetVisible, isPlacing]),
  );

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

    if (isValid) {
      handleFinalizeOrder();
    }
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

    const orderPayload = {
      items: latestCartRef.current,
      totals: summary,
      checkout: checkoutSnapshot,
      address: addressSnapshot,
      paymentMethod: paymentSnapshot,
      leaveAtDoor,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };

    let newOrderId = generateOrderId('FP');

    try {
      const response = await placeOrder(orderPayload);
      if (response?.order?._id || response?._id) {
        newOrderId = response?.order?._id || response?._id;
      }
    } catch (error) {
      console.log(
        'Order API failed, falling back to local confirmation',
        error,
      );
      
    }

    addOrder({ ...orderPayload, id: newOrderId });
    clearCart();
    setOrderId(newOrderId);
    setShowModal(true);
    setIsPlacing(false);
  };

  const addressOptions = useMemo(() => {
    if (address && address.id && !addressBook.some(x => x.id === address.id)) {
      return [address, ...addressBook];
    }
    return addressBook;
  }, [address, addressBook]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
              setDeliveryNextStep(null);
              setActiveSheet('delivery');
            }}
          >
            <Text style={styles.sectionTitle}>Pick-up</Text>
            <ChevronRight size={18} color="#999" />
          </Pressable>

          <Text style={styles.deliveryValue}>
            {checkout?.type === 'pickup' ? 'Pick-up' : 'Delivery'}
          </Text>
          {!!(checkout?.date || checkout?.time) && (
            <Text style={styles.deliverySub}>
              {[checkout?.date, checkout?.time].filter(Boolean).join(' • ')}
            </Text>
          )}
          {errors.checkout && (
            <Text style={styles.errorText}>{errors.checkout}</Text>
          )}
        </View>

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
          <Pressable style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Tip your rider</Text>
            <ChevronRight size={18} color="#999" />
          </Pressable>

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
                  onPress={() => setTipAmount(v)}
                  style={[styles.tipChip, selected && styles.tipChipActive]}
                >
                  <Text
                    style={[
                      styles.tipChipText,
                      selected && styles.tipChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
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
          <Text style={styles.paymentValue}>
            {paymentMethod?.label || 'Credit Card'}
          </Text>
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
            <Text style={styles.billLabel}>Standard Delivery</Text>
            <Text style={styles.billFree}>Free</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Service Fee</Text>
            <Text style={styles.billValue}>
              ₹{summary.serviceFee.toFixed(2)}
            </Text>
          </View>
          <View style={styles.billRow}>
            <View>
              <Text style={styles.billLabel}>Offer Applied</Text>
              <Text style={styles.offerSub}>10% Off</Text>
            </View>
            <Text style={styles.offerValue}>
              -₹{summary.discount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.dashedLine} />

          <View style={[styles.billRow, styles.billRowStrong]}>
            <Text style={styles.billStrong}>Grand Total</Text>
            <Text style={styles.billStrong}>
              ₹{summary.grandTotal.toFixed(2)}
            </Text>
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

        <View style={{ height: 120 }} />
      </ScrollView>

      {errors.submit && (
        <View style={styles.submitErrorContainer}>
          <Text style={styles.submitErrorText}>{errors.submit}</Text>
        </View>
      )}

      <View style={styles.bottomBar}>
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
      </View>

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
        onAddAddress={() => {
          const id = `addr_${Date.now()}`;
          const created = {
            id,
            label: 'Other',
            addressLine: 'New Address (edit later)',
          };
          setAddressBook(prev => [created, ...prev]);
          setAddress(created);
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
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  /* ---------- HEADER ---------- */
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  headerRightSpace: { width: 32 },

  scroll: {
    paddingBottom: 140,
  },

  /* ---------- SECTIONS ---------- */
  sectionCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },

  /* ---------- DELIVERY ---------- */
  deliveryValue: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },
  deliverySub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: '#777',
  },

  /* ---------- ADDRESS ---------- */
  addressRow: {
    marginTop: 8,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
  addressLine: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    lineHeight: 15,
  },

  leaveRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },

  /* ---------- TIP ---------- */
  tipSub: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: '#777',
    lineHeight: 15,
  },

  tipRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },

  tipChip: {
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 16,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#111',
  },

  tipChipTextActive: {
    color: '#FFF',
  },

  /* ---------- PAYMENT ---------- */
  paymentValue: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },

  /* ---------- BILL ---------- */
  billRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  billLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },

  billValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },

  billFree: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E53935',
  },

  offerSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3D3D',
  },

  offerValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3D3D',
  },

  dashedLine: {
    marginTop: 12,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DDD',
  },

  billRowStrong: {
    marginTop: 12,
  },

  billStrong: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
  },

  /* ---------- TERMS ---------- */
  termsText: {
    marginTop: 12,
    paddingHorizontal: 16,
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    lineHeight: 15,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },

  bottomLeft: {},
  bottomTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },
  bottomSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: '#777',
  },

  placeOrderBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeOrderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },

  placeOrderPressed: {
    opacity: 0.9,
  },

  submitErrorContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#FFF',
  },

  submitErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3D3D',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3D3D',
  },
});
