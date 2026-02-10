import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

export default function EasyOrderingScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();


  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigation.replace('MainTabs');
    } else {
      navigation.replace('LoginScreen');
    }
  };
  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      
      <Image
        source={require('../../assets/images/foodWell.png')}
        style={styles.topImage}
        resizeMode="cover"
      />

      {/* Content */}
      <View style={styles.content}>

        <Text style={styles.title}>Easy Ordering</Text>

        <Text style={styles.subtitle}>
          Choose from curated set menus daily — fresh, healthy, and ready to enjoy.
        </Text>

        {/* Pagination */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.active]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  topImage: {
    width: wp(100),
    height: hp(55),
    borderBottomLeftRadius: wp(100),
    borderBottomRightRadius: wp(100),
    overflow: 'hidden',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: wp(8.33),
    paddingTop: hp(5),
  },

  title: {
    fontSize: FONT.xxl,
    fontWeight: '700',
    color: '#111',
    marginBottom: hp(1.5),
  },

  subtitle: {
    fontSize: FONT.sm,
    color: '#777',
    textAlign: 'center',
    lineHeight: hp(2.75),
  },

  dots: {
    flexDirection: 'row',
    marginTop: hp(3.125),
    marginBottom: hp(5),
  },

  dot: {
    width: wp(5),
    height: hp(0.5),
    backgroundColor: '#ddd',
    borderRadius: scale(10),
    marginHorizontal: wp(1.11),
  },

  active: {
    backgroundColor: '#ed1c24',
    width: wp(7.22),
  },

  button: {
    width: '100%',
    backgroundColor: '#ed1c24',
    paddingVertical: hp(2),
    borderRadius: scale(14),
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: FONT.md,
    fontWeight: '600',
  },
});
