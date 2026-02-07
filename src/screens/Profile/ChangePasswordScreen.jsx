import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';

const { width, height } = Dimensions.get('window');

const FIGMA_WIDTH = 313;
const SCALE = width / FIGMA_WIDTH;

const s = v => v * SCALE;

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!currentPassword.trim()) {
      nextErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword.trim()) {
      nextErrors.newPassword = 'New password is required';
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword && confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUpdatePassword = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.put(USER_ROUTES.changePassword, {
        currentPassword,
        newPassword,
      });

      Alert.alert('Success', 'Password updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Failed to update password';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Set a new password in just a few steps.
      </Text>

      {/* Input Fields */}
      <View style={styles.inputBlock}>
        <MaterialTextInput
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="........"
          showPasswordToggle
          error={!!errors.currentPassword}
          errorText={errors.currentPassword}
        />
        <MaterialTextInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="........"
          showPasswordToggle
          error={!!errors.newPassword}
          errorText={errors.newPassword}
        />

        <MaterialTextInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="........"
          showPasswordToggle
          error={!!errors.confirmPassword}
          errorText={errors.confirmPassword}
        />
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleUpdatePassword}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
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
    flex: 1,
    fontSize: s(16),
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: s(11),
    color: '#7C7C7C',
    marginTop: s(12),
    marginBottom: s(24),
  },

  inputBlock: {
    width: '100%',
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
    backgroundColor: '#C7C7C7',
  },

  buttonText: {
    fontSize: s(13),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
