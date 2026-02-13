import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as RNLocalize from 'react-native-localize';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import LogoIcon from '../../assets/icons/LogoIcon.svg';

const { width, height } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'ar', label: 'عربي' },
];

export default function LanguageSelectScreen() {
  const [selected, setSelected] = useState('en');
  const navigation = useNavigation();

  useEffect(() => {
    const locales = RNLocalize.getLocales();
    if (locales.length > 0) {
      const lang = locales[0].languageCode;
      const found = LANGUAGES.find(l => l.code === lang);
      if (found) setSelected(found.code);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
         
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/FoodCurve.png')}
              style={styles.topImage}
              resizeMode="cover"
            />
           {/* <LogoIcon width={200} height={190} style={styles.logo} /> */}
          </View>

          {/* CONTENT */}
          <View style={styles.content}>
            <Text style={styles.title}>Choose Your Language</Text>
            <Text style={styles.subtitle}>
              Select your preferred language to personalize your experience and use
              the app with ease.
            </Text>
            {LANGUAGES.map(lang => (
              <Pressable
                key={lang.code}
                onPress={() => setSelected(lang.code)}
                style={[
                  styles.langCard,
                  selected === lang.code && styles.langSelected,
                ]}
              >
                <Text
                  style={[
                    styles.langText,
                    selected === lang.code && styles.langTextSelected,
                    lang.code === 'ar' && styles.langTextRtl,
                  ]}
                >
                  {lang.label}
                </Text>
                {selected === lang.code && (
                  <View style={styles.checkCircle}>
                    <Check size={16} color="#111" strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View style={styles.btnWrapper}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() =>
              navigation.replace('OnBoarding', { language: selected })
            }
          >
            <Text style={styles.btnText}>Select</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    width: '100%',
    height: height * 0.42,
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
    overflow: 'hidden',
  },
  topImage: {
    width: '100%',
    height: '100%',
  },
  logo: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    width: 190,
    height: 85,
  },
 
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 26,
  },
  
  langCard: {
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  langSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  langText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  langTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
  langTextRtl: {
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  btnWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  btn: {
    backgroundColor: '#ed1c24',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 0,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
