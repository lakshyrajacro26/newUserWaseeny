import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { hp, wp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

const PROMO_CARD_WIDTH = wp(82);
const PROMO_CARD_GAP = wp(3.33);

const PromoCardItem = memo(({ item, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    style={styles.promoCard}
    onPress={onPress}
  >
    <Image source={item.image} style={styles.promoImage} />
    <View style={styles.promoShade} />
    <View style={styles.promoOverlay}>
      <Text style={styles.promoTitle}>{item.title}</Text>
      <Text style={styles.promoSub}>{item.subtitle}</Text>
      <View style={styles.promoBtn}>
        <Text style={styles.promoBtnText}>{item.cta}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

export const PromoCardList = memo(({ promoCards, onPromoPress }) => {
  if (!promoCards || promoCards.length === 0) {
    return null;
  }

  return (
    <FlatList
      horizontal
      data={promoCards}
      keyExtractor={item => item.id}
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled
      contentContainerStyle={styles.promoList}
      snapToInterval={Math.round(PROMO_CARD_WIDTH) + PROMO_CARD_GAP}
      decelerationRate="fast"
      renderItem={({ item }) => (
        <PromoCardItem
          item={item}
          onPress={() => onPromoPress(item)}
        />
      )}
    />
  );
});

const styles = StyleSheet.create({
  promoList: {
    paddingLeft: wp(4.44),
    paddingRight: wp(1.67),
    marginTop: hp(2.25),
  },
  promoCard: {
    width: Math.round(PROMO_CARD_WIDTH),
    marginRight: PROMO_CARD_GAP,
    borderRadius: scale(20),
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  promoImage: {
    width: '100%',
    height: hp(18.75),
  },
  promoShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  promoOverlay: {
    position: 'absolute',
    top: hp(1.75),
    left: wp(3.89),
    right: wp(3.89),
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: FONT.lg + scale(2),
    fontWeight: '400',
  },
  promoSub: {
    color: '#FFFFFF',
    fontSize: FONT.lg + scale(2),
    marginTop: hp(0.25),
    fontWeight: '400',
  },
  promoBtn: {
    marginTop: hp(1.25),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(10),
    paddingHorizontal: wp(3.89),
    paddingVertical: hp(0.75),
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: '#111111',
  },
});
