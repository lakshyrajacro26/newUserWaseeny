import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CouponDetailsDrawer from '../../components/CouponDetailsDrawer';

const COUPONS = [
  {
    id: 'PICHAPIE',
    title: "500 off in Shakey's Pizza",
    amount: 500,
    minSpend: 1000,
    expires: '31 Jan 2026',
    terms: 'Terms valid for new users only. One-time use.',
  },
  {
    id: 'PICHAPIE-2',
    title: "500 off in Shakey's Pizza",
    amount: 500,
    minSpend: 1000,
    expires: '31 Jan 2026',
    terms: 'Terms valid for new users only. One-time use.',
  },
  {
    id: 'PICHAPIE-3',
    title: "500 off in Shakey's Pizza",
    amount: 500,
    minSpend: 1000,
    expires: '31 Jan 2026',
    terms: 'Terms valid for new users only. One-time use.',
  },
  {
    id: 'PICHAPIE-4',
    title: "500 off in Shakey's Pizza",
    amount: 500,
    minSpend: 1000,
    expires: '31 Jan 2026',
    terms: 'Terms valid for new users only. One-time use.',
  },
  {
    id: 'PICHAPIE-5',
    title: "500 off in Shakey's Pizza",
    amount: 500,
    minSpend: 1000,
    expires: '31 Jan 2026',
    terms: 'Terms valid for new users only. One-time use.',
  },
];

export default function Coupons() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const list = useMemo(() => {
    if (!query.trim()) return COUPONS;
    const q = query.toLowerCase();
    return COUPONS.filter(c =>
      [c.id, c.title, c.terms].some(v => v.toLowerCase().includes(q)),
    );
  }, [query]);

  const handleUseNow = (coupon) => {
    setSelectedCoupon(coupon);
  };

  const handleApplyCoupon = (coupon) => {
    // Handle coupon application logic here
    console.log('Applying coupon:', coupon.id);
    // You can navigate to cart or apply the coupon to the order
    // navigation.navigate('Cart', { appliedCoupon: coupon });
  };

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
        <Text style={styles.headerTitle}>Coupons</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <Search size={16} color="#B9B9B9" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Coupon..."
          placeholderTextColor="#B9B9B9"
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {list.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.amountText}>₹ {item.amount.toFixed(2)}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  Min spend ₹ {item.minSpend.toFixed(2)}
                </Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>Use by {item.expires}</Text>
              </View>

              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{item.id}</Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.useBtn}
                  onPress={() => handleUseNow(item)}
                >
                  <Text style={styles.useBtnText}>Use Now</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.terms}>{item.terms}</Text>
            </View>

            <View style={styles.cardRight}>
              <Text style={styles.percent}>%</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <CouponDetailsDrawer
        visible={!!selectedCoupon}
        coupon={selectedCoupon}
        onClose={() => setSelectedCoupon(null)}
        onUseNow={handleApplyCoupon}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700' },
  headerSpacer: { width: 36 },

  searchWrap: {
    margin: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    color: '#111',
  },

  scroll: { paddingHorizontal: 12, paddingBottom: 16 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardLeft: { flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: 12, color: '#222', fontWeight: '700' },
  amountText: { marginTop: 4, fontSize: 20, fontWeight: '800' },
  metaRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 10, color: '#8C8C8C' },
  metaDot: { marginHorizontal: 6, color: '#BDBDBD' },

  codeRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 4,
    borderStyle: 'dashed',
    borderColor: '#4D4D4D',
    padding: 4,
  },
  codeText: {
    fontSize: 10,
    color: '#444',
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    letterSpacing: 0.6,
  },
  useBtn: {
    backgroundColor: '#E53935',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  useBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  terms: { marginTop: 8, fontSize: 9, color: '#9B9B9B' },

  cardRight: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 40,
    color: '#EDEDED',
    fontWeight: '800',
  },
});