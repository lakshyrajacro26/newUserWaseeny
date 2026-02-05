import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CartContext } from '../context/CartContext';

export default function ProductDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};

  const [qty, setQty] = useState(1);
  const { addToCart } = useContext(CartContext);

  if (!item) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* CLOSE BUTTON */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
      >
        <X size={24} color="#555" />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* IMAGE */}
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* TITLE */}
        <Text style={styles.title}>{item.name}</Text>

        {/* RATING */}
        <Text style={styles.rating}>
          ⭐ {item.rating} ({item.reviews})
        </Text>

        {/* CUISINES */}
        <Text style={styles.desc}>{item.cuisines.join(' • ')}</Text>

        <View style={styles.divider} />

        {/* DESCRIPTION (optional, if item has more info) */}
        {item.description && (
          <Text style={styles.desc}>{item.description}</Text>
        )}
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.qtyBox}>
          <TouchableOpacity onPress={() => qty > 1 && setQty(qty - 1)}>
            <Text style={styles.qtyBtn}>−</Text>
          </TouchableOpacity>

          <Text style={styles.qty}>{qty}</Text>

          <TouchableOpacity onPress={() => setQty(qty + 1)}>
            <Text style={styles.qtyBtn}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            addToCart({ ...item, qty });
            navigation.navigate('Address', { item, qty });
          }}
        >
          <Text style={styles.addText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 10,
    backgroundColor: '#EEE',
    borderRadius: 20,
    padding: 8,
  },
  image: {
    width: '100%',
    height: 300,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 8,
    color: '#E53935',
  },
  desc: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFF',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  qtyBtn: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  qty: {
    marginHorizontal: 12,
    fontWeight: '700',
    fontSize: 16,
  },
  addBtn: {
    flex: 1,
    backgroundColor: '#E53935',
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
