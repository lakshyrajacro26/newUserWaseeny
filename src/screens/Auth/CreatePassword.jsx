import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import { ArrowLeft } from 'lucide-react-native';
import { resetPassword } from '../../services/authService';

const { width, height } = Dimensions.get('window');

const FIGMA_WIDTH = 313;
const SCALE = width / FIGMA_WIDTH;

const s = v => v * SCALE;

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const routeObj = useRoute();
  const flow = routeObj?.params?.flow;
  const email = routeObj?.params?.email;
  const resetToken = routeObj?.params?.resetToken;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async () => {
    const passwordValue = newPassword.trim();
    const confirmValue = confirmPassword.trim();
    let hasError = false;

    if (
      passwordValue.length < 6 ||
      !/[A-Z]/.test(passwordValue) ||
      !/\d/.test(passwordValue)
    ) {
      setNewPasswordError(
        'Password must be 6+ chars with 1 uppercase letter and 1 number',
      );
      hasError = true;
    } else {
      setNewPasswordError('');
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
      Toast.show({
        type: 'topError',
        text1: 'Invalid Password',
        text2: 'Please fix the highlighted fields',
        position: 'top',
        autoHide: true,
        visibilityTime: 3000,
      });
      return;
    }

    setIsLoading(true);

    // If flow is 'forget', call reset password API
    if (flow === 'forget' && resetToken) {
      try {
        await resetPassword({ 
          resetToken, 
          newPassword: passwordValue 
        });

        Toast.show({
          type: 'topSuccess',
          text1: 'Password Reset Successful',
          text2: 'You can now login with your new password',
          position: 'top',
          autoHide: true,
          visibilityTime: 2000,
          props: { showLoader: true },
          onHide: () => navigation.replace('LoginScreen'),
        });
      } catch (error) {
        const errMsg = error?.response?.data?.message || error?.message || '';
        Toast.show({
          type: 'error',
          text1: 'Password Reset Failed',
          text2: errMsg || 'Unable to reset password',
          position: 'top',
          autoHide: true,
          visibilityTime: 3000,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Default behavior for other flows (e.g., profile password change)
    Toast.show({
      type: 'topSuccess',
      text1: 'Password Updated',
      text2: 'Your password has been changed',
      position: 'top',
      autoHide: true,
      visibilityTime: 3000,
      props: { showLoader: true },
      onHide: () => {
        // If this flow originated from signup, continue to FoodPreference
        if (flow === 'signup') {
          navigation.replace('FoodPreference', { email });
        } else {
          // default (forget/reset) -> go to Login
          navigation.replace('LoginScreen');
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        
        <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('LoginScreen'))}
            activeOpacity={0.85}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color="#111" />
          </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.inputBlock}>
         <MaterialTextInput
            label="Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="........"
            showPasswordToggle
            error={!!newPasswordError}
            errorText={newPasswordError}
          />
        <MaterialTextInput
            label="Confirm  Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="........"
            showPasswordToggle
            error={!!confirmPasswordError}
            errorText={confirmPasswordError}
          />

       
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleUpdatePassword}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Updating...' : 'Update Password'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingLeft: s(20),
    paddingRight: s(20),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: s(22),
  },

  backIcon: {
    width: s(18),
    height: s(18),
    resizeMode: 'contain',
  },

  title: {
    fontSize: s(16),
    fontWeight: '600',
    color: '#000000',
    marginLeft: s(12),
  },

  subtitle: {
    fontSize: s(11),
    color: '#7C7C7C',
    marginTop: s(12),
    marginBottom: s(24),
  },

  inputBlock: {
    width: '100%',
    marginTop:30
  },

  label: {
    fontSize: s(10),
    color: '#1E1E1E',
    marginBottom: s(6),
  },

  inputContainer: {
    width: '100%',
    height: s(38),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingLeft: s(12),
    paddingRight: s(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  inputContainerFocused: {
    borderColor: '#000000',
  },

  input: {
    flex: 1,
    fontSize: s(11),
    color: '#000000',
    padding: 0,
  },

  eye: {
    width: s(16),
    height: s(16),
    resizeMode: 'contain',
    marginLeft: s(10),
  },

  button: {
    width: '100%',
    height: s(44),
    backgroundColor: '#F31D1D',
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(26),
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: s(13),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: s(10),
    color: '#E11D2E',
    marginTop: s(6),
  },
});
