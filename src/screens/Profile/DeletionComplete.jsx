import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function AccountDeletedScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ImageBackground
        source={require('../../assets/images/BgImgRotate.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.centerBlock}>
          <Image
            source={require('../../assets/icons/deleteEmoji.png')}
            style={styles.emoji}
          />

          <Text style={styles.title}>Account deletion completed.</Text>

          <Text style={styles.subtitle}>We’re sorry to see you go</Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  bg: {
    width: '100%',
    height: '100%',
  },

  centerBlock: {
    position: 'absolute',
    top: 266, // vertical placement from top
    width: '100%',
    flex:1,
    justifyContent:'center',
    alignItems: 'center',
  },

  emoji: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
    color: '#000000',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
    color: '#000000',
    textAlign: 'center',
    marginTop: 2,
  },
});
