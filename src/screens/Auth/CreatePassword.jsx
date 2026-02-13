import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import { ArrowLeft } from 'lucide-react-native';
import { resetPassword } from '../../services/authService';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

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

    
    Toast.show({
      type: 'topSuccess',
      text1: 'Password Updated',
      text2: 'Your password has been changed',
      position: 'top',
      autoHide: true,
      visibilityTime: 3000,
      props: { showLoader: true },
      onHide: () => {
        
        if (flow === 'signup') {
          navigation.replace('FoodPreference', { email });
        } else {
          
          navigation.replace('LoginScreen');
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
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
    backgroundColor: '#ed1c24',
    paddingLeft: wp(5.56),
    paddingRight: wp(5.56),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2.75),
  },

  backIcon: {
    width: wp(5),
    height: hp(2.25),
    resizeMode: 'contain',
  },

  title: {
    fontSize: FONT.md,
    fontWeight: '600',
    color: '#000000',
    marginLeft: wp(3.33),
  },

  subtitle: {
    fontSize: scale(11),
    color: '#7C7C7C',
    marginTop: hp(1.5),
    marginBottom: hp(3),
  },

  inputBlock: {
    width: '100%',
    marginTop: hp(3.75),
  },

  label: {
    fontSize: scale(10),
    color: '#1E1E1E',
    marginBottom: hp(0.75),
  },

  inputContainer: {
    width: '100%',
    height: hp(4.75),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingLeft: wp(3.33),
    paddingRight: wp(3.33),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  inputContainerFocused: {
    borderColor: '#000000',
  },

  input: {
    flex: 1,
    fontSize: scale(11),
    color: '#000000',
    padding: 0,
  },

  eye: {
    width: wp(4.44),
    height: hp(2),
    resizeMode: 'contain',
    marginLeft: wp(2.78),
  },

  button: {
    width: '100%',
    height: hp(5.5),
    backgroundColor: '#ed1c24',
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(3.25),
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: scale(10),
    color: '#ed1c24',
    marginTop: hp(0.75),
  },
});
