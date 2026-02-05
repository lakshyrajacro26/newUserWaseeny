import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';

const RATINGS = [5, 4, 3, 2, 1];
const DELIVERY_TIMES = [
  { label: 'Fastest', value: 'fastest' },
  { label: 'Within 15 min', value: '15' },
  { label: 'Within 30 min', value: '30' },
];
const CUISINES = [
  'Indian',
  'Chinese',
  'Italian',
  'Burger',
  'Pizza',
  'Mexican',
  'Thai',
  'Continental',
];
const DIETARY = ['Vegetarian', 'Vegan', 'Halal'];
const PRICE_MIN = 50;
const PRICE_MAX = 800;

export default function FilterBottomSheet({
  visible,
  onClose,
  onApply,
  initialFilters,
}) {
  const [rating, setRating] = useState(initialFilters?.rating || null);
  const [deliveryTime, setDeliveryTime] = useState(
    initialFilters?.deliveryTime || null,
  );
  const [cuisines, setCuisines] = useState(initialFilters?.cuisines || []);
  const [dietary, setDietary] = useState(initialFilters?.dietary || null);
  const [price, setPrice] = useState(
    initialFilters?.price || { min: PRICE_MIN, max: PRICE_MAX },
  );

  const clearAll = () => {
    setRating(null);
    setDeliveryTime(null);
    setCuisines([]);
    setDietary(null);
    setPrice({ min: PRICE_MIN, max: PRICE_MAX });
  };

  const toggleCuisine = cuisine => {
    setCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine],
    );
  };

  const handleApply = () => {
    onApply({ rating, deliveryTime, cuisines, dietary, price });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.dimArea} onPress={onClose} />
      <View style={styles.sheet}>
        <SafeAreaView style={{flex:1}} edges={['top','bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearAll}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Rating</Text>
          <View style={styles.pillsRow}>
            {RATINGS.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.pill, rating === r && styles.pillSelected]}
                onPress={() => setRating(r)}
              >
                <Text style={styles.pillText}>{'⭐ ' + r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Delivery Time</Text>
          <View style={styles.pillsRow}>
            {DELIVERY_TIMES.map(dt => (
              <TouchableOpacity
                key={dt.value}
                style={[
                  styles.pill,
                  deliveryTime === dt.value && styles.pillSelected,
                ]}
                onPress={() => setDeliveryTime(dt.value)}
              >
                <Text style={styles.pillText}>{dt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Cuisines</Text>
          <View style={styles.chipsRow}>
            {CUISINES.map(cuisine => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.chip,
                  cuisines.includes(cuisine) && styles.chipSelected,
                ]}
                onPress={() => toggleCuisine(cuisine)}
              >
                <Text style={styles.chipText}>{cuisine}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Dietary Options</Text>
          <View style={styles.pillsRow}>
            {DIETARY.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.pill, dietary === option && styles.pillSelected]}
                onPress={() => setDietary(option)}
              >
                <Text style={styles.pillText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>
            Price Range (₹{price.min} - ₹{price.max})
          </Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>₹{PRICE_MIN}</Text>
            <Slider
              style={styles.slider}
              minimumValue={PRICE_MIN}
              maximumValue={PRICE_MAX}
              value={price.min}
              onValueChange={val =>
                setPrice(p => ({ ...p, min: Math.round(val) }))
              }
              minimumTrackTintColor="#E23744"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#E23744"
            />
            <Slider
              style={styles.slider}
              minimumValue={PRICE_MIN}
              maximumValue={PRICE_MAX}
              value={price.max}
              onValueChange={val =>
                setPrice(p => ({ ...p, max: Math.round(val) }))
              }
              minimumTrackTintColor="#E23744"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#E23744"
            />
            <Text style={styles.sliderLabel}>₹{PRICE_MAX}</Text>
          </View>
        </ScrollView>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.showBtn} onPress={handleApply}>
            <Text style={styles.showBtnText}>Show Results</Text>
          </TouchableOpacity>
        </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    minHeight: 520,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAll: {
    color: '#E23744',
    fontWeight: 'bold',
    marginRight: 18,
    fontSize: 16,
  },
  close: {
    fontSize: 22,
    color: '#888',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
    color: '#222',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  pill: {
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pillSelected: {
    backgroundColor: '#E23744',
    borderColor: '#E23744',
  },
  pillText: {
    color: '#222',
    fontWeight: 'bold',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipSelected: {
    backgroundColor: '#E23744',
    borderColor: '#E23744',
  },
  chipText: {
    color: '#222',
    fontWeight: 'bold',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#888',
    width: 48,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  showBtn: {
    backgroundColor: '#E23744',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  showBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
