import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import LogoIcon from '../assets/icons/LogoIcon.svg';
import { useNavigation } from '@react-navigation/native';

const ResetPassword = () => {
  const navigation = useNavigation();

  // Hooks - always at top level
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation and navigation
  const handleCreate = () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({
        type: 'topError',
        text1: 'Error',
        text2: 'Please fill both fields',
        position: 'top',
      });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({
        type: 'topError',
        text1: 'Error',
        text2: 'Password must be at least 6 characters',
        position: 'top',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'topError',
        text1: 'Error',
        text2: 'Passwords do not match',
        position: 'top',
      });
      return;
    }

    // Success alert
    Toast.show({
      type: 'topSuccess',
      text1: 'Success',
      text2: 'Your password has been reset successfully!',
      position: 'top',
    });
    setTimeout(() => navigation.navigate('MainPage'), 600);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <LogoIcon width={130} height={65} style={styles.logo} />

          {/* Title */}
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>
            Password must be different from previous one
          </Text>

          {/* New Password */}
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputBox}>
            <Lock size={18} color="#888" />
            <TextInput
              placeholder="Enter New Password"
              placeholderTextColor="#999"
              secureTextEntry={!showNew}
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              cursorColor="#000"
              selectionColor="#E41E26"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              {showNew ? (
                <EyeOff size={18} color="#888" />
              ) : (
                <Eye size={18} color="#888" />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputBox}>
            <Lock size={18} color="#888" />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirm}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              cursorColor="#000"
              selectionColor="#E41E26"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? (
                <EyeOff size={18} color="#888" />
              ) : (
                <Eye size={18} color="#888" />
              )}
            </TouchableOpacity>
          </View>

          {/* Illustration */}
          <Image
            source={require('../assets/images/Closed.jpg')}
            style={styles.illustration}
            resizeMode="contain"
          />

          {/* Button */}
          <TouchableOpacity style={styles.button} onPress={handleCreate}>
            <Text style={styles.buttonText}>Create</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ed1c24',
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },

  skip: {
    fontSize: 14,
    color: '#000',
  },

  logo: {
    width: 130,
    height: 65,
    alignSelf: 'center',
    marginTop: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 15,
  },

  subtitle: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 5,
  },

  label: {
    fontSize: 12,
    marginTop: 20,
    marginBottom: 6,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 10,
  },

  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#000',
  },

  illustration: {
    width: '100%',
    height: 200,
    marginTop: 25,
  },

  button: {
    height: 50,
    backgroundColor: '#E41E26',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
