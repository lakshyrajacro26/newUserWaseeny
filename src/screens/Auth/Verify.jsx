import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { registerVerify, resendOtp, forgotPasswordVerifyOTP, forgotPasswordResendOTP } from '../../services/authService';
import { clearPendingSignup, getPendingSignup } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function OtpVerificationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { setAuthenticatedUser } = useAuth();
  const flow = route.params?.flow ?? 'signup'; // flow = 'signup' | 'forget'
  const email = route.params?.email ?? '';
  const mobileFromParams = route.params?.mobile ?? '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [mobile, setMobile] = useState(mobileFromParams);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Fade animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!mobileFromParams) {
      getPendingSignup()
        .then(data => {
          if (data?.mobile) {
            setMobile(data.mobile);
          }
        })
        .catch(() => undefined);
    }

    // auto-resend if caller requested it (e.g., login redirected here)
    if (route.params?.autoResend && !isResending) {
      // small timeout to allow component to mount and toast to settle
      setTimeout(() => {
        if (!isResending) handleResend();
      }, 400);
    }
  }, [mobileFromParams, route.params?.autoResend, isResending, handleResend]);

  const handleChange = (text, i) => {
    const numericText = text.replace(/[^0-9]/g, '');
    let newOtp = [...otp];
    newOtp[i] = numericText;
    setOtp(newOtp);
    if (numericText && i < 5) inputs.current[i + 1].focus();
  };

  const handleKeyPress = (e, i) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1].focus();
    }
  };

  const isOtpComplete = otp.every(d => d !== '');

  const handleVerify = async () => {
    if (!isOtpComplete || isLoading) return;

    const otpValue = otp.join('');

    // For password reset flow, verify OTP and get reset token
    if (flow === 'forget') {
      try {
        setIsLoading(true);
        const response = await forgotPasswordVerifyOTP({ 
          email, 
          mobile, 
          otp: otpValue 
        });

        const resetToken = response?.resetToken;
        if (!resetToken) {
          throw new Error('Reset token not received');
        }

        Toast.show({
          type: 'topSuccess',
          text1: 'OTP Verified',
          text2: 'Please set your new password',
          position: 'top',
          autoHide: true,
          visibilityTime: 2000,
          props: { showLoader: true },
          onHide: () => {
            navigation.replace('CreatePassword', { resetToken, flow });
          },
        });
      } catch (error) {
        const errMsg = error?.response?.data?.message || error?.message || '';
        Toast.show({
          type: 'error',
          text1: 'OTP Verification Failed',
          text2: errMsg || 'Invalid or expired OTP',
          position: 'top',
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For signup flow, verify OTP via API
    const mobileValue = (mobile ?? '').trim();

    if (!mobileValue) {
      Toast.show({
        type: 'error',
        text1: 'Mobile number missing',
        text2: 'Please go back and try signup again.',
        position: 'top',
      });
      return;
    }

    try {
      setIsLoading(true);
      const data = await registerVerify({ mobile: mobileValue, otp: otpValue });
      await clearPendingSignup();

      /**
       * PRODUCTION PATTERN:
       * After OTP verification, update AuthContext with token and user
       * This saves to AsyncStorage and marks user as authenticated
       */
      const token = data?.token || data?.accessToken || data?.data?.token;
      const user = data?.user || data?.data?.user;
      
      if (token) {
        await setAuthenticatedUser(token, user);
      }

      Toast.show({
        type: 'topSuccess',
        text1: 'OTP Verified Successfully',
        text2: 'Please wait...',
        position: 'top',
        autoHide: true,
        visibilityTime: 2000,
        props: { showLoader: true },
        onHide: () => {
          navigation.replace('FoodPreference', { email });
        },
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'OTP Verification Failed',
        text2: error?.message || 'Unable to verify OTP',
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (isResending || timer > 0) return;
    try {
      setIsResending(true);
      const payload = { mobile: mobile ?? '', email: email ?? '' };
      
      // Use different endpoint based on flow
      if (flow === 'forget') {
        await forgotPasswordResendOTP(payload);
      } else {
        await resendOtp(payload);
      }
      
      setTimer(30);
      Toast.show({ type: 'topSuccess', text1: 'OTP Sent', text2: 'Please check your messages', position: 'top' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Resend Failed', text2: err?.message || 'Unable to resend OTP', position: 'top' });
    } finally {
      setIsResending(false);
    }
  }, [isResending, timer, mobile, email]);

  return (
    <SafeAreaView style={styles.safe}>
      <Image
        source={require('../../assets/images/BgImgRotate.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <View style={styles.gradientOverlay} />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate('Signup')
        }
      >
        <ArrowLeft size={22} color="#333" />
      </TouchableOpacity>

      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.content}>
          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.description}>
            We sent an SMS with a 6-digit code to your registered Email. Please
            enter it so we can verify your account.
          </Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timer}>{timer}s</Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  digit !== '' && styles.filledOtpBox,
                  focusedIndex === index && styles.focusedOtpBox,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={text => handleChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                cursorColor="#000"
                selectionColor="#000"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, (!isOtpComplete || isLoading) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={!isOtpComplete || isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Verifying...' : 'Verify OTP'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Didn't receive OTP?{' '}
              <Text
                style={[styles.resendText, (timer > 0 || isResending) && styles.resendDisabled]}
                onPress={timer === 0 && !isResending ? handleResend : undefined}
              >
                {isResending ? 'Resending...' : 'Resend'}
              </Text>
            </Text>

            <TouchableOpacity 
              style={styles.changeEmailButton}
              onPress={() => navigation.navigate('ForgetPass')}
            >
              <Text style={styles.changeEmailText}>Change Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    // Flip the image to show bottom part first
    // transform: [{ scaleY: -1 }],
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    // Create gradient blur effect
    backgroundGradient: {
      colors: [
        'transparent',
        'rgba(255,255,255,0.3)',
        'rgba(255,255,255,0.8)',
        '#FFFFFF',
      ],
      start: [0, 0.7],
      end: [0, 0],
    },
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    // backgroundColor: 'rgba(255, 255, 255, 0.95)',
    // borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 20,
    marginBottom: 50,
    // alignItems: 'center',
    // justifyContent:'flex-start',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 10 },
    // shadowOpacity: 0.08,
    // shadowRadius: 20,
    // elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  timerContainer: {
    marginBottom: 12,
  },
  timer: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E11D2E',
    textAlign: 'center',
    letterSpacing: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
    width: '100%',
  },
  otpBox: {
    width: 40,
    height: 40,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filledOtpBox: {
    borderColor: '#E11D2E',
    backgroundColor: '#FFF',
    borderWidth: 2,
  },
  focusedOtpBox: {
    borderColor: '#000000',
    borderWidth: 2,
    backgroundColor: '#FFF',
  },
  button: {
    width: '100%',
    backgroundColor: '#E11D2E',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#E11D2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#FFB3B3',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
  },
  resendText: {
    color: '#E11D2E',
    fontWeight: '700',
  },
  resendDisabled: {
    color: '#999999',
    fontWeight: '400',
  },
  changeEmailButton: {
    paddingVertical: 8,
  },
  changeEmailText: {
    fontSize: 14,
    color: '#E11D2E',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
