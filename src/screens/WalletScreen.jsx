import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { User, Heart, ShoppingBag, CreditCard } from 'lucide-react-native';
import { CartContext } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';

export default function PaymentScreen() {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const navigation = useNavigation();
  const { cart, cartCount } = useContext(CartContext);
  const totalAmount = (cart || []).reduce(
    (s, it) => s + Number(it.price || 0) * (it.qty || 1),
    0,
  );

  const paymentMethods = [
    {
      id: '1',
      name: 'Credit / Debit Card',
      icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    },
    {
      id: '2',
      name: 'UPI',
      icon: 'https://cdn-icons-png.flaticon.com/512/888/888879.png',
    },
    {
      id: '3',
      name: 'PayPal',
      icon: 'https://cdn-icons-png.flaticon.com/512/196/196566.png',
    },
    {
      id: '4',
      name: 'Wallet Balance',
      icon: 'https://cdn-icons-png.flaticon.com/512/3103/3103446.png',
    },
    {
      id: '5',
      name: 'Cash on Delivery',
      icon: 'https://cdn-icons-png.flaticon.com/512/674/674908.png',
    },
  ];

  const handlePay = () => {
    if (!selectedPayment) {
      Alert.alert('Select Payment', 'Please select a payment method first.');
      return;
    }
    Alert.alert('Payment Success', `Paid via ${selectedPayment.name}`);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <User size={22} color="#555" />
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerRight}>
          <Heart size={22} color="#555" />
          <TouchableOpacity
            style={styles.cart}
            onPress={() => {
              // If cart has items, open first item detail for editing
              if (cart && cart.length > 0)
                navigation.navigate('onClickAdd', { item: cart[0] });
              else navigation.navigate('onClickAdd');
            }}
          >
            <ShoppingBag size={22} color="#555" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount || 0}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* TOTAL AMOUNT */}
        <View style={styles.cardMain}>
          <Text style={styles.cardLabel}>Total Amount</Text>
          <Text style={styles.amount}>₱ {totalAmount.toFixed(2)}</Text>
        </View>

        {/* CART ITEMS */}
        {cart && cart.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Cart</Text>
            {cart.map(ci => (
              <TouchableOpacity
                key={ci.id}
                style={styles.cartItem}
                onPress={() => navigation.navigate('onClickAdd', { item: ci })}
              >
                <Image source={{ uri: ci.image }} style={styles.cartItemImg} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '700' }}>{ci.name}</Text>
                  <Text style={{ color: '#777' }}>Qty: {ci.qty || 1}</Text>
                </View>
                <Text style={{ fontWeight: '700' }}>
                  ₱ {(ci.price || 0) * (ci.qty || 1)}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* PAYMENT OPTIONS */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        {paymentMethods.map(method => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentOption,
              selectedPayment?.id === method.id && styles.paymentSelected,
            ]}
            onPress={() => setSelectedPayment(method)}
          >
            <Image source={{ uri: method.icon }} style={styles.paymentIcon} />
            <Text style={styles.paymentText}>{method.name}</Text>
            {selectedPayment?.id === method.id && (
              <View style={styles.selectedDot} />
            )}
          </TouchableOpacity>
        ))}

        {/* ADD CARD BUTTON */}
        <TouchableOpacity
          style={styles.addCardBtn}
          onPress={() => Alert.alert('Add Card')}
        >
          <CreditCard size={18} color="#E91E63" />
          <Text style={styles.addCardText}>Add New Card</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PAY NOW BUTTON */}
      <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
        <Text style={styles.payText}>Pay Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  cart: { marginLeft: 14 },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#E91E63',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  cardMain: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  cardLabel: { fontSize: 14, color: '#777' },
  amount: { fontSize: 24, fontWeight: '700', marginTop: 6 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    color: '#000',
  },

  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  paymentSelected: { borderWidth: 2, borderColor: '#E91E63' },
  paymentIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    resizeMode: 'contain',
  },
  paymentText: { fontSize: 15, fontWeight: '600', flex: 1 },
  selectedDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E91E63',
  },

  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  addCardText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#E91E63',
  },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  cartItemImg: { width: 60, height: 60, borderRadius: 8 },

  payBtn: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#E91E63',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
