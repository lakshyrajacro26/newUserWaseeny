import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Heart, Star } from 'lucide-react-native';
import { hp, wp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
import { getRatingAverage, getRatingCount } from '../../utils/ratingUtils';

export const RestaurantListCard = memo(
  ({ item, isFavorite, onPress, onFavoritePress }) => {
    const cuisines = Array.isArray(item?.cuisine)
      ? item.cuisine
      : Array.isArray(item?.cuisines)
      ? item.cuisines
      : [];
    const cuisineText =
      cuisines.length > 0 ? cuisines.join(', ') : 'Pizza, Italian, Fast Food';
    const distanceText = item?.distance || null;
    const timeText = item?.deliveryTime
      ? `${item.deliveryTime} minutes`
      : '20 - 30 minutes';
    const ratingValue = getRatingAverage(item);
    const ratingCount = getRatingCount(item);
    const bestSellerText = item?.bestSeller || 'Popular choice';

    return (
      <TouchableOpacity
        style={styles.listCard}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.listImageWrap}>
          <Image
            source={
              item.bannerImage && item.bannerImage.trim()
                ? { uri: item.bannerImage }
                : require('../../assets/images/Food.png')
            }
            style={styles.listImage}
          />
          <TouchableOpacity
            style={styles.listFavBtn}
            activeOpacity={0.8}
            onPress={onFavoritePress}
          >
            <Heart
              size={16}
              color={isFavorite ? '#ed1c24' : '#111111'}
              fill={isFavorite ? '#ed1c24' : 'none'}
            />
          </TouchableOpacity>
          <View style={styles.listImageDots}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={`list-dot-${index}`}
                style={
                  index === 4
                    ? [styles.listDot, styles.listDotActive]
                    : styles.listDot
                }
              />
            ))}
          </View>
        </View>
        <View style={styles.listBody}>
          <View style={styles.listTitleRow}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.listRatingRow}>
              <Star size={14} color="#F5A623" fill="#F5A623" />
              <Text style={styles.listRatingValue}>{ratingValue}</Text>
              <Text style={styles.listRatingCount}>({ratingCount})</Text>
            </View>
          </View>
          <Text style={styles.listMeta} numberOfLines={1}>
            {cuisineText}
          </Text>
          <Text style={styles.listSubMeta} numberOfLines={1}>
            {distanceText ? `${distanceText} away | ${timeText}` : timeText}
          </Text>
          <View style={styles.listBestSellerPill}>
            <Text style={styles.listBestSellerText} numberOfLines={1}>
              {bestSellerText}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

export const RestaurantRecommendCard = memo(
  ({ item, isFavorite, onPress, onFavoritePress }) => {
    const cuisines = Array.isArray(item?.cuisine)
      ? item.cuisine
      : Array.isArray(item?.cuisines)
      ? item.cuisines
      : [];
    const cuisineText =
      cuisines.length > 0 ? cuisines.join(', ') : 'Pizza, Italian, Fast Food';
    const distanceText = item?.distance || null;
    const timeText = item?.deliveryTime
      ? `${item.deliveryTime} minutes`
      : '20 - 30 minutes';
    const ratingValue = getRatingAverage(item);
    const ratingCount = getRatingCount(item);
    const bestSellerText = item?.bestSeller || 'Popular choice';

    return (
      <TouchableOpacity
        style={styles.recommendCard}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.recommendImageWrap}>
          <Image
            source={
              item.bannerImage && item.bannerImage.trim()
                ? { uri: item.bannerImage }
                : require('../../assets/images/Food.png')
            }
            style={styles.recommendImage}
          />
          <TouchableOpacity
            style={styles.favBtn}
            activeOpacity={0.8}
            onPress={onFavoritePress}
          >
            <Heart
              size={16}
              color={isFavorite ? '#ed1c24' : '#111111'}
              fill={isFavorite ? '#ed1c24' : 'none'}
            />
          </TouchableOpacity>
          <View style={styles.imageDots}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={`dot-${index}`}
                style={
                  index === 4
                    ? [styles.dot, styles.dotActive]
                    : styles.dot
                }
              />
            ))}
          </View>
        </View>
        <View style={styles.recommendBody}>
          <View style={styles.recommendTitleRow}>
            <Text style={styles.recommendTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.ratingRow}>
              <Star size={14} color="#F5A623" fill="#F5A623" />
              <Text style={styles.ratingValue}>{ratingValue}</Text>
              <Text style={styles.ratingCount}>({ratingCount})</Text>
            </View>
          </View>
          <Text style={styles.recommendMeta} numberOfLines={1}>
            {cuisineText}
          </Text>
          <Text style={styles.recommendSubMeta} numberOfLines={1}>
            {distanceText ? `${distanceText} away | ${timeText}` : timeText}
          </Text>
          <View style={styles.bestSellerPill}>
            <Text style={styles.bestSellerText} numberOfLines={1}>
              {bestSellerText}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  // List Card Styles
  listCard: {
    marginHorizontal: wp(4.44),
    marginTop: hp(1.75),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: hp(0.5) },
    shadowRadius: scale(12),
    overflow: 'visible',
  },
  listImageWrap: {
    position: 'relative',
  },
  listImage: {
    width: '100%',
    height: hp(19.375),
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
  },
  listFavBtn: {
    position: 'absolute',
    top: hp(1.25),
    right: wp(2.78),
    width: wp(9.44),
    height: hp(4.25),
    borderRadius: scale(17),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: scale(6),
    elevation: 2,
  },
  listImageDots: {
    position: 'absolute',
    right: wp(3.33),
    bottom: hp(1.25),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.67),
  },
  listDot: {
    width: wp(1.67),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  listDotActive: {
    width: wp(4.44),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: '#FFFFFF',
  },
  listBody: {
    padding: scale(12),
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(2.22),
  },
  listTitle: {
    fontSize: FONT.sm + scale(2),
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },
  listRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.11),
  },
  listRatingValue: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: '#111111',
  },
  listRatingCount: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
  },
  listMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },
  listSubMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },
  listBestSellerPill: {
    marginTop: hp(1.25),
    backgroundColor: '#FDEEEE',
    borderRadius: scale(14),
    paddingHorizontal: wp(2.78),
    paddingVertical: hp(0.75),
    alignSelf: 'flex-start',
  },
  listBestSellerText: {
    fontSize: FONT.xs,
    color: '#5B3B3B',
    fontWeight: '600',
  },

  // Recommend Card Styles
  recommendCard: {
    width: wp(72.22),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    marginRight: wp(4.44),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: hp(0.5) },
    shadowRadius: scale(12),
    elevation: 4,
    overflow: 'visible',
  },
  recommendImageWrap: {
    position: 'relative',
    padding: wp(1.39),
  },
  recommendImage: {
    width: '100%',
    height: hp(18.125),
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
    borderRadius: scale(18),
  },
  favBtn: {
    position: 'absolute',
    top: hp(1.25),
    right: wp(2.78),
    width: wp(9.44),
    height: hp(4.25),
    borderRadius: scale(17),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: scale(6),
    elevation: 2,
  },
  imageDots: {
    position: 'absolute',
    right: wp(3.33),
    bottom: hp(1.25),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.67),
  },
  dot: {
    width: wp(1.67),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotActive: {
    width: wp(4.44),
    height: hp(0.75),
    borderRadius: scale(3),
    backgroundColor: '#FFFFFF',
  },
  recommendBody: {
    padding: scale(12),
  },
  recommendTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(2.22),
  },
  recommendTitle: {
    fontSize: FONT.sm + scale(2),
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.11),
  },
  ratingValue: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: '#111111',
  },
  ratingCount: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
  },
  recommendMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },
  recommendSubMeta: {
    fontSize: FONT.xs,
    color: '#6E6E6E',
    marginTop: hp(0.75),
  },
  bestSellerPill: {
    marginTop: hp(1.25),
    backgroundColor: '#FDEEEE',
    borderRadius: scale(14),
    paddingHorizontal: wp(2.78),
    paddingVertical: hp(0.75),
    alignSelf: 'flex-start',
  },
  bestSellerText: {
    fontSize: FONT.xs,
    color: '#5B3B3B',
    fontWeight: '600',
  },
});
