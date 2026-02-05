import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

const cardsData = [
  { id: '1', title: 'Credit Card' },
  { id: '2', title: 'Debit Card' },
];

const upiData = [
  {
    id: '1',
    title: 'Google Pay UPI',
    icon: require('../../assets/icons/googlepay.png'),
  },
  {
    id: '2',
    title: 'PhonePe UPI',
    icon: require('../../assets/icons/paypal.png'),
  },
  {
    id: '3',
    title: 'Add new UPI ID',
    isAdd: true,
  },
];

export default function PaymentSettingScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
         <ArrowLeft size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Setting</Text>
      </View>

      {/* Cards Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Cards</Text>

        <FlatList
          data={cardsData}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowText}>{item.title}</Text>
              <Text style={styles.plus}>+</Text>
            </View>
          )}
        />
      </View>

      {/* UPI Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>UPI</Text>

        <FlatList
          data={upiData}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            if (item.isAdd) {
              return (
                <View style={styles.row}>
                  <Text style={styles.rowText}>{item.title}</Text>
                  <Text style={styles.plus}>+</Text>
                </View>
              );
            }

            return (
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Image source={item.icon} style={styles.icon} />
                  <Text style={styles.rowText}>{item.title}</Text>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Header */
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#000000',
  },
  headerTitle: {
        flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
        textAlign: 'center',
  },

  /* Section Card */
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    paddingVertical: 12,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  /* Rows */
  row: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowText: {
    fontSize: 14,
    color: '#111827',
  },

  plus: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '400',
  },

  icon: {
    width: 22,
    height: 22,
    marginRight: 12,
    resizeMode: 'contain',
  },
});
