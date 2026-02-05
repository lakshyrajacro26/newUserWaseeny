import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Animated,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FOOD_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten Free', 'Non Vegetarian'];

const RATING_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: '5', label: '5 stars' },
  { id: '4', label: '4 stars' },
  { id: '3', label: '3 stars' },
  { id: '2', label: '2 stars' },
  { id: '1', label: '1 stars' },
];

export default function FilterDrawer({ visible, onClose, onReset, onApply }) {
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  const drawerWidth = useMemo(() => Math.min(screenWidth, 360), []);

  const [selectedFood, setSelectedFood] = useState({
    Vegetarian: true,
    Vegan: false,
    'Gluten Free': true,
    'Non Vegetarian': false,
  });
  const [rating, setRating] = useState('all');
  const [minPrice, setMinPrice] = useState('120');
  const [maxPrice, setMaxPrice] = useState('900');
  const [area, setArea] = useState('Select area');
  const [radius, setRadius] = useState('Select radius');

  // useEffect(() => {
  //   if (visible) {
  //     Animated.timing(translateX, {
  //       toValue: screenWidth - drawerWidth,
  //       duration: 280,
  //       useNativeDriver: true,
  //     }).start();
  //   } else {
  //     Animated.timing(translateX, {
  //       toValue: screenWidth,
  //       duration: 220,
  //       useNativeDriver: true,
  //     }).start();
  //   }
  // }, [visible, drawerWidth, translateX]);

  const handleToggleFood = label => {
    setSelectedFood(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleReset = () => {
    setSelectedFood({
      Vegetarian: false,
      Vegan: false,
      'Gluten Free': false,
      'Non Vegetarian': false,
    });
    setRating('all');
    setMinPrice('120');
    setMaxPrice('900');
    setArea('Select area');
    setRadius('Select radius');
    if (onReset) {
      onReset();
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        selectedFood,
        rating,
        minPrice,
        maxPrice,
        area,
        radius,
      });
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.drawer,
          // {
          //   width: drawerWidth,
          //   transform: [{ translateX }],
          // },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={onClose} style={styles.headerBack}>
            <Text style={styles.headerBackText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Filter</Text>
          <Pressable onPress={handleReset} hitSlop={10}>
            <Text style={styles.headerReset}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Food Preference</Text>
            {FOOD_OPTIONS.map(label => {
              const checked = !!selectedFood[label];
              return (
                <Pressable
                  key={label}
                  onPress={() => handleToggleFood(label)}
                  style={styles.optionRow}
                >
                  <Text style={styles.optionLabel}>{label}</Text>
                  <View
                    style={[styles.checkbox, checked && styles.checkboxChecked]}
                  >
                    {checked ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Price range</Text>
            <View style={styles.sliderTrack}>
              <View style={styles.sliderActive} />
              <View style={[styles.sliderThumb, styles.sliderThumbLeft]} />
              <View style={[styles.sliderThumb, styles.sliderThumbRight]} />
            </View>
            <View style={styles.priceRow}>
              <View style={styles.priceInputWrap}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="number-pad"
                  style={styles.priceInput}
                />
              </View>
              <Text style={styles.priceDash}>-</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="number-pad"
                  style={styles.priceInput}
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>
            <Text style={styles.fieldLabel}>Area</Text>
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>{area}</Text>
              <Text style={styles.dropdownIcon}>▾</Text>
            </Pressable>
            <Text style={styles.fieldLabel}>Radius</Text>
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>{radius}</Text>
              <Text style={styles.dropdownIcon}>▾</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ratings</Text>
            <View style={styles.ratingRow}>
              {RATING_OPTIONS.map(item => {
                const isActive = rating === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setRating(item.id)}
                    style={[
                      styles.ratingChip,
                      isActive && styles.ratingChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.ratingChipText,
                        isActive && styles.ratingChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable style={styles.searchBtn} onPress={handleApply}>
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  headerBackText: {
    fontSize: 16,
    color: '#111111',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
  },
  headerReset: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  optionLabel: {
    fontSize: 13,
    color: '#4A4A4A',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.4,
    borderColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#111111',
  },
  checkMark: {
    fontSize: 12,
    color: '#111111',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EFEFEF',
    marginTop: 6,
    marginBottom: 12,
    position: 'relative',
  },
  sliderActive: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#111111',
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#111111',
  },
  sliderThumbLeft: {
    left: '18%',
  },
  sliderThumbRight: {
    right: '18%',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    width: (screenWidth - 120) / 2,
  },
  currency: {
    color: '#6E6E6E',
    fontSize: 13,
  },
  priceInput: {
    flex: 1,
    paddingLeft: 4,
    fontSize: 13,
    color: '#111111',
    paddingVertical: 0,
  },
  priceDash: {
    color: '#6E6E6E',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6E6E6E',
    marginBottom: 6,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: 13,
    color: '#6E6E6E',
  },
  dropdownIcon: {
    fontSize: 14,
    color: '#6E6E6E',
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingChip: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
  },
  ratingChipActive: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFECEC',
  },
  ratingChipText: {
    fontSize: 12,
    color: '#6E6E6E',
  },
  ratingChipTextActive: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  searchBtn: {
    marginTop: 6,
    marginBottom: 20,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
