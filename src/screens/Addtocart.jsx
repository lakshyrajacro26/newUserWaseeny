import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react-native';

const AddToCart = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <ArrowLeft size={22} />
            <Text style={styles.headerTitle}>Add to Cart</Text>
          </View>

          {/* Food Info */}
          <View style={styles.foodRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodTitle}>
                Cheeseburger w{'\n'}Fries Small Meal
              </Text>
              <Text style={styles.foodSub}>Cream Small Fries & Drink</Text>
              <Text style={styles.price}>₹129</Text>
            </View>

            <Image
              source={require('../assets/images/Food.png')}
              style={styles.foodImg}
              resizeMode="contain"
            />
          </View>

          {/* Choose Fries */}
          <Text style={styles.sectionTitle}>Choose your Fries</Text>

          <View style={styles.optionBox}>
            <View style={styles.optionRow}>
              <View style={styles.radioActive} />
              <Text style={styles.optionText}>Regular Fries</Text>
              <View style={styles.qtyBox}>
                <Minus size={14} />
                <Text style={styles.qty}>1</Text>
                <Plus size={14} />
              </View>
            </View>

            <View style={styles.optionRow}>
              <View style={styles.radio} />
              <Text style={styles.optionText}>Curly Fries</Text>
              <Text style={styles.extra}>₹10</Text>
            </View>

            <View style={styles.optionRow}>
              <View style={styles.radio} />
              <Text style={styles.optionText}>Potato Wedges</Text>
              <Text style={styles.extra}>₹15</Text>
            </View>
          </View>

          {/* Special Instructions */}
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            placeholder="Enter your recipe"
            style={styles.input}
            placeholderTextColor="#999"
          />

          {/* Extras */}
          <View style={styles.extraRow}>
            <View style={styles.radio} />
            <Text style={styles.optionText}>Extra Ketchup (₹5)</Text>
            <ShoppingCart size={18} />
          </View>

          <View style={styles.extraRow}>
            <View style={styles.radio} />
            <Text style={styles.optionText}>
              Regular Coke + Large Fries (₹30)
            </Text>
            <Text style={styles.extra}>₹30</Text>
          </View>

          <View style={styles.extraRow}>
            <View style={styles.radio} />
            <Text style={styles.optionText}>Corn Salad (₹40)</Text>
            <Text style={styles.extra}>₹60</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.total}>₹129</Text>
        <TouchableOpacity style={styles.cartBtn}>
          <Text style={styles.cartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddToCart;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  container: {
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },

  foodRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },

  foodTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  foodSub: {
    fontSize: 13,
    color: '#777',
    marginVertical: 4,
  },

  price: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 5,
  },

  foodImg: {
    width: 140,
    height: 140,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
  },

  optionBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },

  radioActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E41E26',
    marginRight: 10,
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#999',
    marginRight: 10,
  },

  optionText: {
    flex: 1,
    fontSize: 14,
  },

  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    borderRadius: 20,
    paddingHorizontal: 10,
  },

  qty: {
    marginHorizontal: 8,
    fontWeight: '600',
  },

  extra: {
    fontSize: 13,
    fontWeight: '600',
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 45,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginVertical: 5,
  },

  bottomBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  total: {
    fontSize: 18,
    fontWeight: '700',
  },

  cartBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#E41E26',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },

  cartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
