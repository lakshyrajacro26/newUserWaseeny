import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, DollarSign } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TRANSACTIONS = [
  {
    id: 'A12345678',
    title: 'Ocean Breeze Café',
    method: 'Credit Card',
    date: '02 Sep 2025, 7:45 PM',
    amount: 850,
  },
  {
    id: 'A12345678-2',
    title: 'Ocean Breeze Café',
    method: 'Credit Card',
    date: '02 Sep 2025, 7:45 PM',
    amount: 850,
  },
  {
    id: 'A12345678-3',
    title: 'Ocean Breeze Café',
    method: 'Credit Card',
    date: '02 Sep 2025, 7:45 PM',
    amount: 850,
  },
  {
    id: 'A12345678-4',
    title: 'Ocean Breeze Café',
    method: 'Credit Card',
    date: '02 Sep 2025, 7:45 PM',
    amount: 850,
  },
  {
    id: 'A12345678-5',
    title: 'Ocean Breeze Café',
    method: 'Credit Card',
    date: '02 Sep 2025, 7:45 PM',
    amount: 850,
  },
  {
    id: 'A12345678-6',
    title: 'Ocean Breeze Café',
    method: 'Credit Card',
    date: '02 Sep 2025, 7:45 PM',
    amount: 850,
  },
];

export default function WalletProfile() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceValue}>₹ 0</Text>
          <Text style={styles.balanceLabel}>Total Wallet Balance</Text>
          <View style={styles.balanceGlow} />
          <View style={styles.balanceGlowSmall} />
        </View>

        <Text style={styles.sectionTitle}>All Transactions</Text>

        {TRANSACTIONS.map(item => (
          <View key={item.id} style={styles.txCard}>
            <View style={styles.txLeft}>
              <View style={styles.txIconWrap}>
                <DollarSign size={14} color="#111" />
              </View>
              <View style={styles.txMeta}>
                <Text style={styles.txId}>#{item.id}</Text>
                <Text style={styles.txTitle}>{item.title}</Text>
                <Text style={styles.txMethod}>{item.method}</Text>
              </View>
            </View>
            <View style={styles.txRight}>
              <Text style={styles.txDate}>{item.date}</Text>
              <Text style={styles.txAmount}>₹ {item.amount.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    color: '#111',
    fontSize: 16,
  },
  headerSpacer: { width: 36 },

  scroll: { padding: 14, paddingBottom: 24 },

  balanceCard: {
    height: 120,
    borderRadius: 14,
    backgroundColor: '#E41C26',
    padding: 16,
    overflow: 'hidden',
  },
  balanceValue: { color: '#FFF', fontSize: 26, fontWeight: '800' },
  balanceLabel: { marginTop: 4, color: '#FFE7E7', fontSize: 11 },
  balanceGlow: {
    position: 'absolute',
    right: -20,
    top: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  balanceGlowSmall: {
    position: 'absolute',
    right: 20,
    bottom: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },

  txCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  txIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txMeta: { gap: 2 },
  txId: { fontSize: 9, color: '#777' },
  txTitle: { fontSize: 12, color: '#111', fontWeight: '700' },
  txMethod: { fontSize: 10, color: '#8E8E8E' },

  txRight: { alignItems: 'flex-end' },
  txDate: { fontSize: 9, color: '#8E8E8E', marginBottom: 4 },
  txAmount: { fontSize: 12, color: '#111', fontWeight: '700' },
});
