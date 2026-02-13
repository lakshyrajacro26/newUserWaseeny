import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export const CartBottomBar = memo(({ cartCount, subtotal, onPress }) => {
  if (cartCount <= 0) {
    return null;
  }

  return (
    <View style={styles.cartBar}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cartBarTitle}>Items in cart: {cartCount}</Text>
        <Text style={styles.cartBarSub}>Subtotal ₹{subtotal}</Text>
      </View>

      <TouchableOpacity
        style={styles.cartBtn}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <Text style={styles.cartBtnText}>Go to Cart</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  cartBar: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
    backgroundColor: '#111',
    borderRadius: scale(16),
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBarTitle: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: FONT_SIZES.sm,
  },
  cartBarSub: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: FONT_SIZES.xs,
    marginTop: scale(2),
  },
  cartBtn: {
    backgroundColor: '#FF3D3D',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: scale(12),
  },
  cartBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: FONT_SIZES.xs,
  },
});
