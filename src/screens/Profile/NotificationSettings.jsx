import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Switch,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useHideTabBar from '../../utils/hooks/useHideTabBar';

const NotificationSettings = () => {
  const navigation = useNavigation();
  useHideTabBar(navigation);
  const [state, setState] = useState({
    order: false,
    promo: false,
    rec: false,
    rem: false,
    app: false,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../../assets/icons/Backarrow.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Item
            title="Order Updates"
            desc="Get real-time alerts about your order status — from kitchen to delivery"
            value={state.order}
            onChange={() => setState({ ...state, order: !state.order })}
          />

          <Item
            title="Promotions & Offers"
            desc="Stay updated on discounts, coupons, and special deals."
            value={state.promo}
            onChange={() => setState({ ...state, promo: !state.promo })}
          />

          <Item
            title="Recommendations"
            desc="Receive personalized food suggestions based on your taste."
            value={state.rec}
            onChange={() => setState({ ...state, rec: !state.rec })}
          />

          <Item
            title="Reminders"
            desc="Meal-time nudges so you never miss lunch or dinner."
            value={state.rem}
            onChange={() => setState({ ...state, rem: !state.rem })}
          />

          <Item
            title="App Updates & News"
            desc="Be the first to know about new features and announcements"
            value={state.app}
            onChange={() => setState({ ...state, app: !state.app })}
            last
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const Item = ({ title, desc, value, onChange, last }) => {
  return (
    <View style={[styles.item, last && { borderBottomWidth: 0 }]}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E4E4E4', true: '#4CAF50' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

export default NotificationSettings;
const styles = StyleSheet.create({
  safe: {
    flex: 1,
backgroundColor: '#FFFFFF',  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 8,
    borderRadius: 18,
    paddingTop: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },

  backIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.2,
  },

  card: {
    marginTop: 12,
    marginHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
  },

  textBlock: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },

  desc: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#8A8A8A',
  },
});
