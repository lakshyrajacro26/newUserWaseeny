import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, LocateFixed } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import useHideTabBar from '../../utils/hooks/useHideTabBar';

export default function AddAddressScreen() {
  const navigation = useNavigation();
  useHideTabBar(navigation);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.outer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Address</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Map */}
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 25.276987,
            longitude: 55.296249,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
        />

        {/* Locate Button */}
        <TouchableOpacity style={styles.locate}>
          <LocateFixed size={20} color="#000" />
        </TouchableOpacity>

        {/* Bottom Card */}
        <View style={styles.bottomCard}>
          <View style={styles.locationRow}>
            <View style={styles.dot} />
            <Text style={styles.address}>
              Logistics Park,Dubai Industrial City,Dubai, United Arab Emirates
            </Text>
          </View>

          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Continue</Text>
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
    borderRadius: 6,
    overflow: 'hidden',
  },

  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },

  map: {
    flex: 1,
  },

  locate: {
    position: 'absolute',
    right: 15,
    bottom: 210,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  bottomCard: {
    backgroundColor: '#fff',
    padding: 16
  },

  locationRow: {
    flexDirection: 'row',
    // alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    margin: 16
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
    marginRight: 12,
  },

  address: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    lineHeight: 18,
  },

  btn: {
    height: 50,
    backgroundColor: '#F21D1D',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
