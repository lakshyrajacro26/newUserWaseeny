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


const CARD = 104;
const GAP = 12;

export default function FoodPreferences() {
  const [selected, setSelected] = useState([]);
  const navigation = useNavigation();

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
        onPress={() => navigation.navigate('LoginScreen')}
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
    paddingHorizontal: 16,
  },

  header: {
    marginTop: 10,
  },

  title: {
    marginTop: 18,
    fontSize: 30,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6F6F6F',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },

  grid: {
    marginTop: 22,
    paddingBottom: 110,
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
    borderRadius: 16,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 16,
  },

  cardText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 2,
  },

  activeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
    borderColor: '#00D6FF',
    borderRadius: 16,
  },

  button: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 60,
    height: 54,
    backgroundColor: '#FF2D2D',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
