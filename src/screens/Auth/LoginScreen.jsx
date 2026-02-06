import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { login, checkVerificationStatus } from '../../services/authService';
import LogoIcon from '../../assets/icons/LogoIcon.svg';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import MaterialTextInput from "../../components/input/MaterialTextInput"
import { useAuth } from '../../context/AuthContext';
            
const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('lakshykod@gmail.com');
  const [password, setPassword] = useState('Hii@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { setAuthenticatedUser } = useAuth();

  useEffect(() => {
    const prefillEmail = route?.params?.email || route?.params?.prefillEmail;
    if (prefillEmail) setEmail(prefillEmail);
  }, [route?.params?.email, route?.params?.prefillEmail]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID_HERE',
      offlineAccess: true,
    });
  }, []);
  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      console.log('Google User:', userInfo);

      // 👉 Send this token to your backend
      // userInfo.idToken
    } catch (error) {
      console.log('Google Sign-In Error:', error);
    }
  };
  const handleEmailChange = text => {
    const value = text ?? '';
    const digitsOnly = value.replace(/\D/g, '');
    if (value.length > 0 && digitsOnly.length === value.length) {
      setEmail(digitsOnly.slice(0, 16));
      return;
    }

    setEmail(value);
  };

  const handleLogin = async () => {
    if (isLoading) {
      return;
    }


    const emailValue = email.trim();
    const passwordValue = password.trim();


    

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    let hasError = false;

    if (!emailValue) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!emailRegex.test(emailValue)) {
      setEmailError('Enter a valid email address');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (!passwordValue) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (
      passwordValue.length < 6 ||
      !/[A-Z]/.test(passwordValue) ||
      !/\d/.test(passwordValue)
    ) {
      setPasswordError(
        'Password must be 6+ chars with 1 uppercase letter and 1 number',
      );
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) {
      return;
    }

    try {
      setIsLoading(true);
      const data = await login({ email: emailValue, password: passwordValue });

      // Consider login successful if API returned a token or user
      const token = data?.token || data?.accessToken || data?.data?.token;
      const user = data?.user || data?.data?.user;

      if (!token && !user) {
        throw new Error(data?.message || 'Login failed: invalid credentials');
      }

      /**
       * PRODUCTION PATTERN:
       * 1. Update AuthContext state with token and user
       * 2. This triggers AuthContext to save to AsyncStorage
       * 3. isAuthenticated becomes true
       * 4. Navigation automatically routes to MainTabs
       */
      await setAuthenticatedUser(token, user);

      Toast.show({
        type: 'topSuccess',
        text1: 'Login Successful',
        text2: 'Welcome back 👋',
        position: 'top',
        autoHide: true,
        visibilityTime: 2000,
        props: { showLoader: true },
        onHide: () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] }),
      });
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message || '';

      // Detect unverified account based on common phrases from backend
      if (/verify|not verify|not verified|unverified|complete verification/i.test(errMsg)) {
        try {
          const status = await checkVerificationStatus({ email: emailValue });
          const isVerified = status?.verified ?? status?.isVerified ?? false;
          const returnedMobile = status?.mobile || '';

          if (!isVerified) {
            Toast.show({
              type: 'info',
              text1: 'Account Not Verified',
              text2: 'Please complete registration via OTP',
              position: 'top',
              autoHide: true,
              visibilityTime: 2500,
              onHide: () =>
                navigation.replace('Verify', {
                  flow: 'signup',
                  email: emailValue,
                  mobile: returnedMobile,
                  autoResend: true,
                }),
            });
            return;
          }
        } catch (innerErr) {
          // ignore and show generic error below
        }
      }

      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errMsg || 'Unable to login',
        position: 'top',
        autoHide: true,
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/BgImg.png')}
            style={styles.topImage}
            resizeMode="cover"
            blurRadius={2}
          />

          <View style={styles.headerOverlay} />
          <View style={styles.headerBottomFade} />

          <LogoIcon width={180} height={150} style={styles.logo} />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Log in to continue your meal journey
          </Text>

 <MaterialTextInput
            label="Email"
            value={email}
             onChangeText={handleEmailChange}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!emailError}
            errorText={emailError}
          />
            <MaterialTextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            showPasswordToggle
            error={!!passwordError}
            errorText={passwordError}
          />
          <Text
            style={styles.forgot}
            onPress={() => navigation.navigate('ForgetPass')}
          >
            Forgot password?
          </Text>

          <Pressable
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
          >
            <Text style={styles.btnText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          <Pressable style={styles.googleBtn} onPress={signInWithGoogle}>
            <Image
              source={require('../../assets/icons/google.png')}
              style={styles.googleIcon}
              resizeMode="contain"
            />
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          <Text style={styles.footer}>
            Don’t have an account?{' '}
            <Text
              style={styles.register}
              onPress={() => navigation.replace('Signup')}
            >
              Register Now
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  container: {
    flex: 1,
  },

  header: {
    width: '100%',
    height: height * 0.66, // matches design proportion
    overflow: 'hidden',
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    position: 'absolute',

  },

  topImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },

  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  headerBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  logo: {
    alignSelf: 'center',
    width: 180,
    height: 90,
    marginTop: 50,
  },

  /* CONTENT */
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 180,
    zIndex: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },

  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },

  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },

  inputBox: {
    borderWidth: 1.5,
    borderColor: '#D9E0F2',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  inputBoxFocused: {
    borderColor: '#000000',
    backgroundColor: '#F9F9F9',
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },

  eyeBtn: {
    paddingLeft: 10,
    paddingVertical: 6,
  },

  eyeIcon: {
    width: 18,
    height: 18,
    tintColor: '#9AA0A6',
  },

  forgot: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginBottom: 20,
  },

  btn: {
    backgroundColor: '#E11D2E',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },

  btnDisabled: {
    opacity: 0.7,
  },

  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    columnGap: 12,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9ECF3',
  },

  orText: {
    color: '#999',
    fontSize: 13,
  },

  googleBtn: {
    borderWidth: 1,
    borderColor: '#E3E7F0',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: 10,
    marginBottom: 12,
  },

  googleIcon: {
    width: 18,
    height: 18,
  },

  googleText: {
    fontSize: 14,
    color: '#333',
  },

  footer: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },

  register: {
    color: '#E11D2E',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#E11D2E',
    marginTop: -6,
    marginBottom: 10,
  },
});
