import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { foodOptions } from '../../Data/foodOptions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

const CARD = wp(28.89);
const GAP = wp(3.33);

export default function FoodPreferences() {
  const [selected, setSelected] = useState([]);
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('LoginScreen');
  };

  const toggleSelect = id => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const renderItem = ({ item }) => {
    const active = selected.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => toggleSelect(item.id)}
        style={{ width: CARD }}
      >
        <ImageBackground
          source={item.image}
          style={styles.card}
          imageStyle={styles.cardImage}
        >
          <View style={styles.overlay} />
          <Text style={styles.cardText}>{item.title}</Text>
          {active && <View style={styles.activeBorder} />}
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleBack}
      >
        <ArrowLeft size={22} color="#000" />
      </TouchableOpacity>

      {/* TITLE */}
      <Text style={styles.title}>Food Preferences</Text>

      {/* SUBTITLE */}
      <Text style={styles.subtitle}>
        Choose your favorite food types and dietary preferences to personalize
        your menu and get recommendations you’ll love.
      </Text>

      {/* GRID */}
      <FlatList
        data={foodOptions}
        keyExtractor={i => i.id}
        numColumns={3}
        columnWrapperStyle={{ gap: GAP, justifyContent: 'center' }}
        contentContainerStyle={styles.grid}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      {/* BUTTON */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.button}
        onPress={() => navigation.replace('MainTabs', { screen: 'Home' })}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp(4.44),
  },

  header: {
    marginTop: hp(1.25),
  },

  title: {
    marginTop: hp(2.25),
    fontSize: FONT.xl + scale(4),
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: hp(0.75),
    fontSize: FONT.xs,
    color: '#6F6F6F',
    textAlign: 'center',
    lineHeight: hp(2.25),
    paddingHorizontal: wp(3.33),
  },

  grid: {
    marginTop: hp(2.75),
    paddingBottom: hp(22),
    rowGap: GAP,
    alignItems: 'center',
  },

  card: {
    width: CARD,
    height: CARD,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardImage: {
    borderRadius: scale(16),
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: scale(16),
  },

  cardText: {
    color: '#FFF',
    fontSize: scale(11),
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 2,
  },

  activeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: scale(2.5),
    borderColor: '#00D6FF',
    borderRadius: scale(16),
  },

  button: {
    position: 'absolute',
    left: wp(4.44),
    right: wp(4.44),
    bottom: hp(7.5),
    height: hp(6.75),
    backgroundColor: '#FF2D2D',
    borderRadius: scale(27),
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFF',
    fontSize: FONT.sm,
    fontWeight: '700',
  },
});
