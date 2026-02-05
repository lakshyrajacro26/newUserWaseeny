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
    <SafeAreaView style={styles.safe}>
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
                  placeholder="khalid_ai@gmail.com"
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
  safe: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1, backgroundColor: '#FFF' },
  innerContainer: { flex: 1 },

  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  headerRightSpace: { width: 40 },

  scrollContent: {
    paddingBottom: 24,
  },

  heroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 0,
  },
  heroCircle: {
    position: 'absolute',
    width: 520,
    height: 600,
    borderRadius: 260,
    top: -310,
    backgroundColor: 'rgba(255,61,61,0.06)',
  },
  heroImg: {
    width: 250,
    height: 250,
    marginTop: -10,
  },
  heroSpacer: {
    height: 220,
  },

  content: {
    marginTop: 40,
    paddingHorizontal: 18,
    backgroundColor: '#FFF',
    position: 'relative',
    zIndex: 2,
    elevation: 0,
  },
  desc: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    lineHeight: 22,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '700',
    marginBottom: 8,
  },
  inputBox: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D9E0F2',
    backgroundColor: '#F7F9FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: { fontSize: 14, color: '#111', fontWeight: '700' },

  btn: {
    marginTop: 18,
    height: 54,
    backgroundColor: '#E11D2E',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});