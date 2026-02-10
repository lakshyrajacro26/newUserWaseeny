import React, { useLayoutEffect, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import MaterialTextInput from '../../components/input/MaterialTextInput';
import useHideTabBar from "../../utils/hooks/useHideTabBar";
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';
import OTPVerificationModal from '../../components/OTPVerificationModal';

const ProfileScreen = () => {

  const navigation = useNavigation();
  useHideTabBar(navigation);
  
  // Profile data states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [language, setLanguage] = useState('en');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  
  // Original values for comparison
  const [originalData, setOriginalData] = useState({});
  
  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // OTP modal states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await apiClient.get(USER_ROUTES.profile);
      const user = response?.data?.user || response?.data;
      
      // Set form fields
      setName(user?.name || '');
      setEmail(user?.email || '');
      setMobile(user?.mobile || '');
      setLanguage(user?.language || 'en');
      setProfileImage(user?.profilePic || null);
      
      // Store original values for comparison
      setOriginalData({
        name: user?.name || '',
        email: user?.email || '',
        mobile: user?.mobile || '',
        language: user?.language || 'en',
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: openCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: openGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
      includeBase64: false,
      saveToPhotos: false,
    };

    launchCamera(options, (response) => {
      handleImageResponse(response);
    });
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      handleImageResponse(response);
    });
  };

  const handleImageResponse = (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
      return;
    }

    if (response.errorCode) {
      console.log('ImagePicker Error: ', response.errorMessage);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      setProfileImage(asset.uri);
      setProfileImageFile({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `profile_${Date.now()}.jpg`,
      });
    }
  };

  const handleUpdateProfile = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!mobile.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      setIsUpdating(true);

      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Add fields that changed
      if (name !== originalData.name) {
        formData.append('name', name);
      }
      if (email !== originalData.email) {
        formData.append('email', email);
      }
      if (mobile !== originalData.mobile) {
        formData.append('mobile', mobile);
      }
      if (language !== originalData.language) {
        formData.append('language', language);
      }
      
      // Add profile picture if changed
      if (profileImageFile) {
        formData.append('profilePic', profileImageFile);
      }

      // Make API call
      const response = await apiClient.put(USER_ROUTES.updateProfile, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Check if OTP is required
      if (response?.data?.requiresOTP) {
        // OTP required - show OTP modal
        setPendingUpdate(response.data);
        setShowOTPModal(true);
        Alert.alert(
          'Verification Required',
          response?.data?.message || 'Please verify your changes with the OTP sent to your email/mobile'
        );
      } else {
        // Profile updated successfully without OTP
        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    try {
      setIsVerifying(true);
      const response = await apiClient.post(USER_ROUTES.verifyProfileOTP, { otp });
      
      setShowOTPModal(false);
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const errorMessage = error?.response?.data?.message || 'Invalid OTP';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await apiClient.post(USER_ROUTES.resendProfileOTP);
      Alert.alert('Success', 'OTP resent successfully');
    } catch (error) {
      console.error('Error resending OTP:', error);
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Back Button and Title */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ArrowLeft size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Profile</Text>
            <View style={{ width: 24 }} />
          </View>

          {isLoadingProfile ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ed1c24" />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : (
            <>
              {/* Profile Image */}
              <View style={styles.profileImageContainer}>
                <View style={styles.imageWrapper}>
                  <Image
                    source={
                      profileImage
                        ? { uri: profileImage }
                        : require('../../assets/icons/user.png')
                    }
                    style={styles.profileImage}
                  />
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={showImagePickerOptions}
                    activeOpacity={0.8}
                  >
                    <Camera size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={showImagePickerOptions}>
                  <Text style={styles.changePhotoText}>Change Profile Picture</Text>
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <MaterialTextInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                />

                <MaterialTextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <MaterialTextInput
                  label="Mobile Number"
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="Enter your mobile number"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />

                {/* Language Selector */}
                <View style={styles.languageContainer}>
                  <Text style={styles.languageLabel}>Language</Text>
                  <View style={styles.languageButtons}>
                    <TouchableOpacity
                      style={[
                        styles.languageButton,
                        language === 'en' && styles.languageButtonActive,
                      ]}
                      onPress={() => setLanguage('en')}
                    >
                      <Text
                        style={[
                          styles.languageButtonText,
                          language === 'en' && styles.languageButtonTextActive,
                        ]}
                      >
                        English
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.languageButton,
                        language === 'de' && styles.languageButtonActive,
                      ]}
                      onPress={() => setLanguage('de')}
                    >
                      <Text
                        style={[
                          styles.languageButtonText,
                          language === 'de' && styles.languageButtonTextActive,
                        ]}
                      >
                        German
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.languageButton,
                        language === 'ar' && styles.languageButtonActive,
                      ]}
                      onPress={() => setLanguage('ar')}
                    >
                      <Text
                        style={[
                          styles.languageButtonText,
                          language === 'ar' && styles.languageButtonTextActive,
                        ]}
                      >
                        Arabic
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
        
        {/* Update Button */}
        {!isLoadingProfile && (
          <TouchableOpacity
            style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]}
            onPress={handleUpdateProfile}
            activeOpacity={0.9}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.updateButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        visible={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        loading={isVerifying}
        title="Verify Profile Update"
        message={pendingUpdate?.message || "Enter the OTP sent to your email/mobile"}
      />
    </SafeAreaView>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#F0F0F0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ed1c24',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#ed1c24',
    fontWeight: '600',
  },
  form: {
    marginBottom: 40,
  },
  languageContainer: {
    marginTop: 20,
  },
  languageLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    fontWeight: '500',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#ed1c24',
    borderColor: '#ed1c24',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  updateButton: {
    height: 50,
    backgroundColor: '#ed1c24',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  updateButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});