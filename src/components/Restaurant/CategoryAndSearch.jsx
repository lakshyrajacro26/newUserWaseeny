import React, { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export const SearchBar = memo(({ value, onChangeText, placeholder = 'Search Dish Name....' }) => {
  return (
    <View style={styles.searchBox}>
      <Search size={18} color="#9AA0A6" />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#9AA0A6"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
});

export const CategoryPills = memo(({ categories, activeCategory, onCategoryPress }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.catRow}
    >
      {(categories || []).map(cat => (
        <TouchableOpacity key={cat.id} onPress={() => onCategoryPress(cat.id)}>
          <View
            style={[
              styles.catPill,
              activeCategory === cat.id && styles.catPillActive,
            ]}
          >
            <Text
              style={[
                styles.catText,
                activeCategory === cat.id && styles.catTextActive,
              ]}
            >
              {cat.name || cat}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  searchBox: {
    margin: SPACING.lg,
    backgroundColor: '#F2F4F7',
    borderRadius: scale(14),
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: '#111',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    paddingVertical: 0,
  },
  catRow: {
    paddingLeft: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  catPill: {
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(9),
    borderRadius: scale(18),
    backgroundColor: '#F2F4F7',
  },
  catPillActive: {
    backgroundColor: '#FF3D3D',
  },
  catText: {
    color: '#6F6F6F',
    fontWeight: '800',
    fontSize: FONT_SIZES.xs,
  },
  catTextActive: {
    color: '#FFF',
  },
});
