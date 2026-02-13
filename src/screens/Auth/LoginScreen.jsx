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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { login, checkVerificationStatus } from '../../services/authService';
import LogoIcon from '../../assets/icons/LogoIcon.svg';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import MaterialTextInput from "../../components/input/MaterialTextInput"
import { useAuth } from '../../context/AuthContext';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';
            
export default function LoginScreen() {
  const [email, setEmail] = useState('lakshykod@gmail.com');
  const [password, setPassword] = useState('Hii@123456');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { login } = useAuth();


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


  const validate = () => {
    let valid = true;
    
    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError('Enter a valid email');
      valid = false;
    } else {
      setEmailError('');
    }
    
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  };
  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      const result = await login(email, password);
     console.log("Login result", result)
      if (result.success) {
        Toast.show({
          type: 'topSuccess',
          text1: 'Login Successful',
          text2: 'Welcome back!',
        });

        navigation.replace('MainTabs');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: result.message,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        text2: 'Please try again',
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

          <LogoIcon width={wp(50)} height={hp(18.75)} style={styles.logo} />
        </View>

       
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
    height: hp(66), 
    overflow: 'hidden',
    borderBottomLeftRadius: scale(34),
    borderBottomRightRadius: scale(34),
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
    height: hp(8.75),
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  logo: {
    alignSelf: 'center',
    width: wp(50),
    height: hp(11.25),
    marginTop: hp(6.25),
  },

  
  content: {
    flex: 1,
    paddingHorizontal: wp(6.67),
    paddingTop: hp(22.5),
    zIndex: 1,
  },

  title: {
    fontSize: FONT.xxl,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111',
  },

  subtitle: {
    fontSize: FONT.sm,
    color: '#777',
    textAlign: 'center',
    marginTop: hp(1),
    marginBottom: hp(2.75),
  },

  label: {
    fontSize: FONT.xs,
    color: '#555',
    marginBottom: hp(0.75),
  },

  inputBox: {
    borderWidth: 1.5,
    borderColor: '#D9E0F2',
    backgroundColor: '#F2F2F2',
    borderRadius: scale(12),
    paddingHorizontal: wp(3.89),
    height: hp(6.25),
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: hp(1.75),
  },
  inputBoxFocused: {
    borderColor: '#000000',
    backgroundColor: '#F9F9F9',
  },

  input: {
    flex: 1,
    fontSize: FONT.sm,
    color: '#000',
  },

  eyeBtn: {
    paddingLeft: wp(2.78),
    paddingVertical: hp(0.75),
  },

  eyeIcon: {
    width: wp(5),
    height: hp(2.25),
    tintColor: '#9AA0A6',
  },

  forgot: {
    fontSize: FONT.xs,
    color: '#666',
    textAlign: 'right',
    marginBottom: hp(2.5),
  },

  btn: {
    backgroundColor: '#ed1c24',
    borderRadius: scale(16),
    paddingVertical: hp(2.25),
    alignItems: 'center',
  },

  btnDisabled: {
    opacity: 0.7,
  },

  btnText: {
    color: '#FFF',
    fontSize: FONT.md,
    fontWeight: '600',
  },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(2),
    columnGap: wp(3.33),
  },

  orLine: {
    flex: 1,
    height: hp(0.125),
    backgroundColor: '#E9ECF3',
  },

  orText: {
    color: '#999',
    fontSize: FONT.xs,
  },

  googleBtn: {
    borderWidth: 1,
    borderColor: '#E3E7F0',
    backgroundColor: '#FFF',
    borderRadius: scale(12),
    paddingVertical: hp(1.75),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: wp(2.78),
    marginBottom: hp(1.5),
  },

  googleIcon: {
    width: wp(5),
    height: hp(2.25),
  },

  googleText: {
    fontSize: FONT.sm,
    color: '#333',
  },

  footer: {
    textAlign: 'center',
    marginTop: hp(1.25),
    fontSize: FONT.xs,
    color: '#666',
    marginBottom: hp(2.5),
  },

  register: {
    color: '#ed1c24',
    fontWeight: '600',
  },
  errorText: {
    fontSize: FONT.xs,
    color: '#ed1c24',
    marginTop: hp(-0.75),
    marginBottom: hp(1.25),
  },
});
