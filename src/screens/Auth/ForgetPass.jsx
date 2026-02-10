import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import Toast from 'react-native-toast-message';
import { forgotPasswordInitiate } from '../../services/authService';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

export default function ForgetPass() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    const emailValue = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValue) {
      setEmailError('Email is required');
      return;
    }

    if (!emailRegex.test(emailValue)) {
      setEmailError('Enter a valid email');
      return;
    }

    setEmailError('');

    try {
      setIsLoading(true);
      const response = await forgotPasswordInitiate({ email: emailValue });

      Toast.show({
        type: 'topSuccess',
        text1: 'OTP Sent Successfully',
        text2: 'Check your email to continue',
        position: 'top',
        visibilityTime: 2000,
        autoHide: true,
        props: { showLoader: true },
        onHide: () =>
          navigation.navigate('Verify', { 
            flow: 'forget', 
            email: emailValue,
            mobile: response?.mobile || ''
          }),
      });
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message || '';
      
      Toast.show({
        type: 'error',
        text1: 'Failed to Send OTP',
        text2: errMsg || 'Unable to send OTP',
        position: 'top',
        autoHide: true,
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {/* Background Hero - Behind everything */}
            <View style={styles.heroWrap} pointerEvents="none">
              <View style={styles.heroCircle} />
              <Image
                source={require('../../assets/images/kiteDDD.png')}
                style={styles.heroImg}
                resizeMode="contain"
              />
            </View>

            
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
                style={styles.backBtn}
              >
                <ArrowLeft size={20} color="#111" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Forgot Password</Text>
              <View style={styles.headerRightSpace} />
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              
              <View style={styles.heroSpacer} />

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.desc}>
                  Enter your registered email and{`\n`}we'll send you a link/OTP to
                  reset{`\n`}your password
                </Text>


                <MaterialTextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!emailError}
                  errorText={emailError}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                />


                <TouchableOpacity
                  style={[styles.btn, isLoading && styles.btnDisabled]}
                  activeOpacity={0.9}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                >
                  <Text style={styles.btnText}>{isLoading ? 'Sending...' : 'Send OTP'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );s
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ed1c24' },
  container: { flex: 1, backgroundColor: '#FFF' },
  innerContainer: { flex: 1 },

  header: {
    height: hp(7),
    paddingHorizontal: wp(3.89),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: wp(11.11),
    height: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: FONT.md, fontWeight: '800', color: '#111' },
  headerRightSpace: { width: wp(11.11) },

  scrollContent: {
    paddingBottom: hp(3),
  },

  heroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp(37.5),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 0,
  },
  heroCircle: {
    position: 'absolute',
    width: wp(144.44),
    height: hp(75),
    borderRadius: wp(72.22),
    top: hp(-38.75),
    backgroundColor: 'rgba(255,61,61,0.06)',
  },
  heroImg: {
    width: wp(69.44),
    height: hp(31.25),
    marginTop: hp(-1.25),
  },
  heroSpacer: {
    height: hp(27.5),
  },

  content: {
    marginTop: hp(5),
    paddingHorizontal: wp(5),
    backgroundColor: '#FFF',
    position: 'relative',
    zIndex: 2,
    elevation: 0,
  },
  desc: {
    fontSize: FONT.md,
    fontWeight: '800',
    color: '#111',
    lineHeight: hp(2.75),
    marginBottom: hp(2.5),
  },
  label: {
    fontSize: FONT.xs,
    color: '#666',
    fontWeight: '700',
    marginBottom: hp(1),
  },
  inputBox: {
    height: hp(6),
    borderWidth: 1,
    borderColor: '#D9E0F2',
    backgroundColor: '#F7F9FF',
    borderRadius: scale(12),
    paddingHorizontal: wp(3.89),
    justifyContent: 'center',
  },
  input: { fontSize: FONT.sm, color: '#111', fontWeight: '700' },

  btn: {
    marginTop: hp(2.25),
    height: hp(6.75),
    backgroundColor: '#ed1c24',
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: { color: '#FFF', fontSize: FONT.sm, fontWeight: '900' },
});