import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, LocateFixed } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import useHideTabBar from '../../utils/hooks/useHideTabBar';

const { width, height } = Dimensions.get('window');

export default function AddAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const address = route?.params?.address;
  const isEditing = !!address;

  const [mapRegion, setMapRegion] = useState({
    latitude: address?.coordinates?.[1] || 25.276987,
    longitude: address?.coordinates?.[0] || 55.296249,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });

  useHideTabBar(navigation);

  const handleContinue = () => {
    // Navigate to AddressFormScreen with the selected address data and coordinates
    const updatedAddress = {
      ...address,
      _id: address?._id || address?.id,
      coordinates: [mapRegion.longitude, mapRegion.latitude],
    };
    navigation.navigate('AddressFormScreen', { address: updatedAddress });
  };

  const handleRegionChange = (region) => {
    setMapRegion(region);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.outer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Edit Address' : 'Add Address'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Map */}
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChange={handleRegionChange}
          initialRegion={{
            latitude: address?.coordinates?.[1] || 25.276987,
            longitude: address?.coordinates?.[0] || 55.296249,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
        />

        {/* Locate Button */}
        <TouchableOpacity 
          style={styles.locate}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <LocateFixed size={22} color="#333" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Bottom Card */}
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.locationRow}>
            <View style={styles.dot} />
            <Text style={styles.address} numberOfLines={3}>
              {address?.fullAddress ||
                'Logistics Park,Dubai Industrial City,Dubai, United Arab Emirates'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.btn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {isEditing ? 'Update Address' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },

  outer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 0,
    overflow: 'hidden',
  },

  header: {
    height: height * 0.065,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },

  title: {
    fontSize: width > 400 ? 18 : 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },

  map: {
    flex: 1,
  },

  locate: {
    position: 'absolute',
    right: width * 0.04,
    bottom: height * 0.22,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  bottomCard: {
    backgroundColor: '#fff',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  locationRow: {
    flexDirection: 'row',
    marginBottom: height * 0.02,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: width * 0.04,
    marginHorizontal: 0,
    backgroundColor: '#fafafa',
    borderColor: '#e8e8e8',
    minHeight: 80,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E41C26',
    marginRight: width * 0.03,
    marginTop: 2,
    flexShrink: 0,
  },

  address: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    fontWeight: '500',
  },

  btn: {
    height: height * 0.065,
    minHeight: 50,
    backgroundColor: '#E41C26',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#E41C26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
