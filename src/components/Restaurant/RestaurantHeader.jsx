import React, { memo } from 'react';
import { View, Image, TouchableOpacity, Pressable, Text, StyleSheet } from 'react-native';
import { ArrowLeft, Heart, Star } from 'lucide-react-native';
import { hp, wp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export const RestaurantHeader = memo(({
  headerImage,
  onBackPress,
  isFavorite,
  onFavoritePress,
  ratingAverage,
  ratingCount,
}) => {
  return (
    <View style={styles.headerContainer}>
      <Image source={headerImage} style={styles.headerImage} />

      {/* Back button */}
      <TouchableOpacity style={styles.headerIconLeft} onPress={onBackPress}>
        <ArrowLeft size={18} color="#000" />
      </TouchableOpacity>

      {/* Right icons */}
      <View style={styles.headerIconRightGroup}>
        <Pressable style={styles.headerIcon} onPress={onFavoritePress}>
          <Heart
            size={18}
            color={isFavorite ? '#FF3D3D' : '#000'}
            fill={isFavorite ? '#FF3D3D' : 'transparent'}
          />
        </Pressable>
      </View>

      {/* Rating pill */}
      {ratingCount > 0 ? (
        <View style={styles.ratingBadge}>
          <Star size={14} color="#FFB800" fill="#FFB800" />
          <Text style={styles.ratingText}>
            {typeof ratingAverage === 'number' ? ratingAverage.toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.ratingSubText}>({ratingCount})</Text>
        </View>
      ) : (
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>New</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: hp(29),
  },
  headerIconLeft: {
    position: 'absolute',
    top: scale(24),
    left: SPACING.lg,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  headerIconRightGroup: {
    position: 'absolute',
    top: scale(24),
    right: SPACING.lg,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  headerIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: scale(35),
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(7),
    borderRadius: scale(18),
    elevation: 4,
  },
  ratingText: {
    marginLeft: SPACING.sm,
    fontWeight: '800',
    fontSize: FONT_SIZES.sm,
    color: '#000',
  },
  ratingSubText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#666',
  },
});
