import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function EasyOrderingScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  /**
   * PRODUCTION ROUTING:
   * After onboarding, user goes to:
   * - LoginScreen if not authenticated
   * - MainTabs (HomeStack) if already authenticated
   */
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
        <Pressable style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>

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
    width: width,
    height: height * 0.55,
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
    overflow: 'hidden',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
  },

  dots: {
    flexDirection: 'row',
    marginTop: 25,
    marginBottom: 40,
  },

  dot: {
    width: 18,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 10,
    marginHorizontal: 4,
  },

  active: {
    backgroundColor: '#E11D2E',
    width: 26,
  },

  button: {
    width: '100%',
    backgroundColor: '#E11D2E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
