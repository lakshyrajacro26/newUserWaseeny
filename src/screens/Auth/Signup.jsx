import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { registerInitiate, checkVerificationStatus } from '../../services/authService';
import { savePendingSignup } from '../../services/storage';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function CreateAccountScreen() {
  const navigation = useNavigation();
  const { setAuthenticatedUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleFirstNameChange = text => {
    const value = text ?? '';
    setFirstName(value.replace(/[^a-zA-Z\s]/g, ''));
  };

  const handleLastNameChange = text => {
    const value = text ?? '';
    setLastName(value.replace(/[^a-zA-Z\s]/g, ''));
  };

  const handleMobileChange = text => {
    const value = text ?? '';
    const digitsOnly = value.replace(/\D/g, '');
    setMobile(digitsOnly.slice(0, 10));
  };

  const handleCreateAccount = async () => {
    if (isLoading) {
      return;
    }

    const firstNameValue = firstName.trim();

    const lastNameValue = lastName.trim();
    const emailValue = email.trim();
    const mobileValue = mobile.trim();
    const passwordValue = password.trim();
    const confirmValue = confirmPassword.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    let hasError = false;

    if (!firstNameValue) {
      setFirstNameError('First name is required');
      hasError = true;
    } else if (firstNameValue.length < 2) {
      setFirstNameError('First name must be at least 2 characters');
      hasError = true;
    } else {
      setFirstNameError('');
    }

    if (!lastNameValue) {
      setLastNameError('Last name is required');
      hasError = true;
    } else if (lastNameValue.length < 2) {
      setLastNameError('Last name must be at least 2 characters');
      hasError = true;
    } else {
      setLastNameError('');
    }

    if (!emailValue) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!emailRegex.test(emailValue)) {
      setEmailError('Enter a valid email address');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (!mobileValue) {
      setMobileError('Mobile number is required');
      hasError = true;
    } else if (!phoneRegex.test(mobileValue)) {
      setMobileError('Enter a valid 10-digit mobile number');
      hasError = true;
    } else {
      setMobileError('');
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

    if (!confirmValue) {
      setConfirmPasswordError('Confirm password is required');
      hasError = true;
    } else if (confirmValue !== passwordValue) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    } else {
      setConfirmPasswordError('');
    }

    if (hasError) {
      return;
    }

    try {
      setIsLoading(true);
      const nameValue = `${firstNameValue} ${lastNameValue}`.trim();

      await registerInitiate({
        name: nameValue,
        email: emailValue,
        password: passwordValue,
        mobile: mobileValue,
        role: 'customer',
      });

      await savePendingSignup({ email: emailValue, mobile: mobileValue });

      Toast.show({
        type: 'topSuccess',
        text1: 'Account Created Successfully',
        text2: 'Verify your account to continue',
        position: 'top',
        autoHide: true,
        visibilityTime: 3000,
        props: { showLoader: true },
        onHide: () =>
          navigation.replace('Verify', {
            flow: 'signup',
            email: emailValue,
            mobile: mobileValue,
          }),
      });
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message || '';

      // If backend indicates user already exists, check verification status
      if (/already|exists/i.test(errMsg)) {
        try {
          const status = await checkVerificationStatus({ email: emailValue, mobile: mobileValue });
          const isVerified = status?.verified ?? status?.isVerified ?? false;
          const returnedMobile = status?.mobile || mobileValue;

          if (!isVerified) {
            Toast.show({
              type: 'info',
              text1: 'Account Pending Verification',
              text2: 'Please complete verification to continue',
              position: 'top',
              autoHide: true,
              visibilityTime: 3000,
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

          // if already verified, suggest login
          Toast.show({
            type: 'info',
            text1: 'Account Already Exists',
            text2: 'Please login to continue',
            position: 'top',
            autoHide: true,
            visibilityTime: 3000,
            onHide: () => navigation.replace('LoginScreen', { email: emailValue }),
          });
          return;
        } catch (innerErr) {
          // fallback to generic message
        }
      }

      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: errMsg || 'Unable to create account',
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* HEADER - Login Screen जैसा */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/BgImg.png')}
            style={styles.topImage}
            resizeMode="cover"
            blurRadius={2}
          />

          <View style={styles.headerOverlay} />
          <View style={styles.headerBottomFade} />
          {/* <LogoIcon width={180} height={90} style={styles.logo} /> */}
        </View>

        {/* CONTENT */}
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>
            Sign up to explore delicious meals and get them delivered to your
            location
          </Text>

          <MaterialTextInput
            label="First Name"
            value={firstName}
            onChangeText={handleFirstNameChange}
            placeholder="Enter First Name"
            autoCapitalize="words"
            error={!!firstNameError}
            errorText={firstNameError}
          />

          <MaterialTextInput
            label="Last Name"
            value={lastName}
            onChangeText={handleLastNameChange}
            placeholder="Enter Last Name"
            autoCapitalize="words"
            error={!!lastNameError}
            errorText={lastNameError}
          />
          <MaterialTextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!emailError}
            errorText={emailError}
          />
          <MaterialTextInput
            label="Mobile Number"
            value={mobile}
            onChangeText={handleMobileChange}
            placeholder="Enter your Mobile Number"
            keyboardType="phone-pad"
            autoCapitalize="none"
            maxLength={10}
            error={!!mobileError}
            errorText={mobileError}
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
          <MaterialTextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}

            placeholder="Enter your password"
            showPasswordToggle
            error={!!confirmPasswordError}
            errorText={confirmPasswordError}
          />

          <Pressable
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleCreateAccount}
          >
            <Text style={styles.btnText}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </Text>
          </Pressable>

          <View style={styles.footerBlock}>
            <Text style={styles.terms}>
              I agree to the <Text style={styles.link}>Terms & Conditions</Text>{' '}
              and <Text style={styles.link}>Privacy Policy</Text>
            </Text>

            <Text style={styles.footer}>
              Already have an account?{' '}
              <Text
                style={styles.register}
                onPress={() => navigation.replace('LoginScreen')}
              >
                Login
              </Text>
            </Text>
          </View>
        </ScrollView>
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
    height: height * 0.66,
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
    paddingHorizontal: 24,
    paddingTop: 90,
    paddingBottom: 24,
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
    borderWidth: 1,
    borderColor: '#D9E0F2',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 40,
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },

  inputBoxFocused: {
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
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

  btn: {
    backgroundColor: '#E11D2E',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
  },

  btnDisabled: {
    opacity: 0.7,
  },

  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  footerBlock: {
    marginTop: 20,
  },

  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: '#777',
    marginBottom: 16,
  },

  link: {
    color: '#F41F1F',
    fontWeight: '600',
  },

  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
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
