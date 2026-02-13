import React, { memo } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export const RestaurantInfo = memo(({
  thumbImage,
  name,
  cuisines,
  deliveryTime,
  freeDeliveryText,
  minOrder,
}) => {
  return (
    <View style={styles.infoBox}>
      <View style={styles.topRow}>
        <Image source={thumbImage} style={styles.resThumb} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>{(cuisines || []).join(', ')}</Text>
        </View>
      </View>

      <View style={styles.deliveryRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.deliveryText}>Delivery {deliveryTime}</Text>
          <Text style={styles.freeDeliveryText}>{freeDeliveryText}</Text>
          <Text style={styles.minOrderText}>Min order - {minOrder}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  infoBox: {
    padding: SPACING.lg,
    marginTop: scale(-28),
    backgroundColor: '#FFF',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
  },
  topRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  resThumb: {
    width: scale(86),
    height: scale(96),
    borderRadius: scale(16),
    borderWidth: 3,
    borderColor: '#FFFFFF',
    top: scale(-45),
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  meta: {
    color: '#7A7A7A',
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
  },
  deliveryRow: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#111',
  },
  freeDeliveryText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#FF3D3D',
  },
  minOrderText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    color: '#7A7A7A',
    fontWeight: '600',
  },
});
