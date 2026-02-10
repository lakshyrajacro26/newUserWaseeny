import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';

const { width, height } = Dimensions.get('window');

const ADDRESS_TYPES = ['Home', 'Work', '+ Add New'];

const normalizeLabelForApi = (label) => {
  const key = String(label || '').trim().toLowerCase();
  if (key === 'home') return 'Home';
  if (key === 'work') return 'Work';
  if (key === 'office') return 'Office';
  if (key === 'other') return 'Other';
  return 'Other';
};

export default function AddressFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const address = route?.params?.address;
  const isEditing = !!address;

  const [formData, setFormData] = useState({
    addressLine: address?.addressLine || '',
    deliveryInstructions: address?.deliveryInstructions || '',
    city: address?.city || '',
    zipCode: address?.zipCode || '',
    label: address?.label || 'home',
  });
  const [selectedLabel, setSelectedLabel] = useState(
    address?.label?.toLowerCase() || 'home'
  );
  const [isDefault, setIsDefault] = useState(address?.isDefault || false);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useHideTabBar(navigation);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.addressLine.trim())
      newErrors.addressLine = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAddress = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const payload = {
        addressLine: formData.addressLine.trim(),
        city: formData.city.trim(),
        zipCode: formData.zipCode.trim(),
        label: normalizeLabelForApi(selectedLabel),
        deliveryInstructions: formData.deliveryInstructions.trim(),
        isDefault,
        // Include location with coordinates if available
        ...(address?.coordinates && {
          location: {
            type: 'Point',
            coordinates: address.coordinates,
          },
        }),
      };

      let response;

      const addressId = address?._id || address?.id;

      if (isEditing && addressId) {
        // Update existing address
        const updateUrl = USER_ROUTES.addressById.replace(':id', addressId);
        response = await apiClient.put(updateUrl, payload);
        Toast.show({
          type: 'topSuccess',
          text1: 'Success',
          text2: 'Address updated successfully!',
          position: 'top',
        });
        setTimeout(() => {
          // Reset navigation to AddressesScreen to clear the stack
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'ProfileHome' },
                { name: 'AddressesScreen' },
              ],
            })
          );
        }, 600);
      } else {
        // Create new address
        response = await apiClient.post(USER_ROUTES.addresses, payload);
        Toast.show({
          type: 'topSuccess',
          text1: 'Success',
          text2: 'Address added successfully!',
          position: 'top',
        });
        setTimeout(() => {
          // Reset navigation to AddressesScreen to clear the stack
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'ProfileHome' },
                { name: 'AddressesScreen' },
              ],
            })
          );
        }, 600);
      }

      console.log('Address saved:', response?.data);
    } catch (error) {
      console.error('Error saving address:', error);
      const errorMsg =
        error?.response?.data?.message ||
        error.message ||
        'Failed to save address. Please try again.';
      Toast.show({
        type: 'topError',
        text1: 'Error',
        text2: errorMsg,
        position: 'top',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getAddressDisplay = () => {
    return address?.fullAddress ||
      'No location selected. Please select from map.';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Address' : 'Add New Address'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Address Section */}
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Add Address</Text>

            {/* Location Display */}
            <View style={styles.locationBox}>
              <View style={styles.locationHeader}>
                <MapPin size={18} color="#E41C26" strokeWidth={2.5} />
                <Text style={styles.locationBoxTitle}>Selected Location</Text>
              </View>
              <Text style={styles.locationText}>{getAddressDisplay()}</Text>
            </View>
          </View>

          {/* Location Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Details</Text>

            {/* Address Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.addressLine && styles.inputError,
                ]}
                placeholder="Street Address or Building Name"
                placeholderTextColor="#999"
                value={formData.addressLine}
                onChangeText={(value) => handleInputChange('addressLine', value)}
              />
              {errors.addressLine && (
                <Text style={styles.errorText}>{errors.addressLine}</Text>
              )}
            </View>

            {/* City Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                placeholder="City"
                placeholderTextColor="#999"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
              />
              {errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            {/* Zip Code Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.zipCode && styles.inputError,
                ]}
                placeholder="Zip Code"
                placeholderTextColor="#999"
                value={formData.zipCode}
                onChangeText={(value) => handleInputChange('zipCode', value)}
              />
              {errors.zipCode && (
                <Text style={styles.errorText}>{errors.zipCode}</Text>
              )}
            </View>

            {/* Delivery Instructions Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Delivery Instructions (Optional)"
                placeholderTextColor="#999"
                value={formData.deliveryInstructions}
                onChangeText={(value) =>
                  handleInputChange('deliveryInstructions', value)
                }
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Save Address As Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Save Address as</Text>

            <View style={styles.tagsContainer}>
              {ADDRESS_TYPES.map((type) => {
                const typeKey = type.toLowerCase().replace(' ', '').replace('+', 'add');
                const isSelected =
                  selectedLabel === type.toLowerCase() ||
                  (type === 'Home' && selectedLabel === 'home') ||
                  (type === 'Work' && selectedLabel === 'work');

                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.tag, isSelected && styles.tagActive]}
                    onPress={() => {
                      if (type !== '+ Add New') {
                        setSelectedLabel(type.toLowerCase());
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        isSelected && styles.tagTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Set as Default */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.defaultRow}
              onPress={() => setIsDefault(!isDefault)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  isDefault && styles.checkboxActive,
                ]}
              >
                {isDefault && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.defaultText}>
                Set as default delivery address
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Add Address Button */}
        <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.addButton, isSaving && styles.addButtonDisabled]}
            onPress={handleAddAddress}
            activeOpacity={0.85}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.addButtonText}>
                {isEditing ? 'Update Address' : 'Add Address'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: width > 400 ? 18 : 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.02,
  },
  addressSection: {
    marginBottom: height * 0.025,
  },
  section: {
    marginBottom: height * 0.025,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  locationBox: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: width * 0.04,
    backgroundColor: '#f9f9f9',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E41C26',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 21,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.018,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#fff',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#E41C26',
  },
  errorText: {
    color: '#E41C26',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    backgroundColor: '#fff',
    minWidth: width * 0.28,
    alignItems: 'center',
  },
  tagActive: {
    backgroundColor: '#E41C26',
    borderColor: '#E41C26',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tagTextActive: {
    color: '#fff',
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: '#E41C26',
    backgroundColor: '#E41C26',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  defaultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  buttonsContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#E41C26',
    borderRadius: 12,
    paddingVertical: height * 0.017,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#E41C26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#cc1a22',
    opacity: 0.8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
