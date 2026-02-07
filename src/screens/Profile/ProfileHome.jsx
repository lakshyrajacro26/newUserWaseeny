import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Heart, Tag, Wallet } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import DeleteAccountPopUp from './DeleteAccountPopUp';
import LoadingModal from '../../components/LoadingModal';
import apiClient from '../../config/apiClient';
import { USER_ROUTES } from '../../config/routes';

const { width } = Dimensions.get('window');

export default function ProfileHome() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const rootNavigation = useMemo(() => {
    let current = navigation;
    while (current?.getParent?.()) {
      const parent = current.getParent();
      if (!parent) break;
      current = parent;
    }
    return current;
  }, [navigation]);

  /**
   * PRODUCTION LOGOUT HANDLER:
   * 
   * 1. Show loading modal
   * 2. Call logout API endpoint
   * 3. Clear auth token from AsyncStorage and in-memory state
   * 4. Reset navigation to LoginScreen
   * 5. This triggers AuthContext.isAuthenticated = false
   * 6. AppNavigator conditionally removes MainTabs and shows LoginScreen
   */
  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await apiClient.get(USER_ROUTES.profile);
      const user = response?.data?.user || response?.data;
      setUserData(user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Fetch profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Refetch when screen comes into focus (after editing profile)
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Clear token from AsyncStorage and auth state
      await logout();

      // Reset navigation (AuthContext state change will handle routing)
      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'LoginScreen' }],
        }),
      );
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <LoadingModal visible={isLoggingOut} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Profile */}
        <View style={styles.header}>
        </View>

        {/* Quick Actions Cards */}
        <View style={styles.ImageContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              source={
                userData?.profilePic
                  ? { uri: userData.profilePic }
                  : require('../../assets/icons/user.png')
              }
              style={styles.avatar}
            />
          </View>
          {isLoadingProfile ? (
            <ActivityIndicator color="#E41C26" style={{ marginTop: 12 }} />
          ) : (
            <>
              <Text style={styles.name}>{userData?.name || 'User'}</Text>
              <Text style={styles.phone}>📞 {userData?.mobile || 'N/A'}</Text>
            </>
          )}
        </View>
        <View style={styles.quickActionsContainer}>

          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.8}
            onPress={() => rootNavigation.navigate('Favourite')}
          >
            <View style={styles.iconCircle}>
              <Heart size={20} color="#E41C26" />
            </View>
            <Text style={styles.quickActionText}>Favourites</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Coupons')}
          >
            <View style={styles.iconCircle}>
              <Tag size={20} color="#E41C26" />
            </View>
            <Text style={styles.quickActionText}>Coupons</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <TouchableOpacity
          style={styles.walletCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('WalletProfile')}
        >
          <View style={styles.walletLeft}>
            <View style={styles.iconCircle}>
              <Wallet size={20} color="#E41C26" />
            </View>
            <Text style={styles.walletText}>Wallet</Text>
          </View>
          <Text style={styles.walletAmount}>
            {userData?.walletBalance?.toFixed(2) || '0.00'}
          </Text>
        </TouchableOpacity>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              title="Your Profile"
              onPress={() => navigation.navigate('ProfileEdit')}
            />
            <MenuItem
              title="Delivery Address"
              onPress={() => navigation.navigate('AddAddressScreen')}
            />
            <MenuItem
              title="Food Preference"
              onPress={() => navigation.navigate('FoodPreference')}
              isLast
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              title="FAQ's"
              onPress={() => navigation.navigate('FaqScreen')}
            />
            <MenuItem
              title="Contact Support"
              onPress={() => navigation.navigate('ContactSupport')}
              isLast
            />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              title="Notification Settings"
              onPress={() => navigation.navigate('NotificationSettings')}
            />
            <MenuItem
              title="Payment Setting"
              onPress={() => navigation.navigate('PaymentSetting')}
            />
            <MenuItem
              title="Change Password"
              onPress={() => navigation.navigate('ChangePasswordScreen')}
            />
            <MenuItem
              title="Delete Account"
              onPress={() => setShowDeletePopup(true)}
              isLast
            />
          </View>
        </View>

        {/* About App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About App</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              title="Privacy Policy"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
            <MenuItem
              title="Terms & Condition"
              onPress={() => navigation.navigate('TermsConditionScreen')}
            />
            <MenuItem
              title="Logout"
              onPress={handleLogout}
              isLast
            />
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Popup */}
      <DeleteAccountPopUp
        visible={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
        onDelete={() => {
          setShowDeletePopup(false);
          setTimeout(() => {
            navigation.navigate('DeleteAccountScreen');
          }, 0);
        }}
      />
    </SafeAreaView>
  );
}

/* ---------- Menu Item Component ---------- */
const MenuItem = ({ title, onPress, isLast }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    style={[styles.menuItem, isLast && styles.menuItemLast]}
    onPress={onPress}
  >
    <Text style={styles.menuItemText}>{title}</Text>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  scrollContent: {
    paddingBottom: 24,
  },

  /* Header */
  header: {
    backgroundColor: '#E41C26',
    paddingTop: 60,
    paddingBottom: 24,
    height: 160,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  phone: {
    fontSize: 13,
    color: '#000',
    marginTop: 4,
    opacity: 0.9,
  },

  ImageContainer: {
    marginTop: -58,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  /* Quick Actions */
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 10,
  },

  quickActionCard: {
    flex: 1,
    marginTop: 20,
    backgroundColor: '#FDF8F8',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent:'center',
    borderWidth: 1,
    borderColor: '#00000024',
    flexDirection:'row'
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom: 8,
  },

  quickActionText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '600',
  },

  /* Wallet Card */
  walletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FDF8F8',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00000024'
  },

  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  walletText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '600',
  },

  walletAmount: {
    fontSize: 16,
    color: '#E41C26',
    fontWeight: '700',
  },

  /* Sections */
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00000024'
  },

  /* Menu Items */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  menuItemLast: {
    borderBottomWidth: 0,
  },

  menuItemText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },

  chevron: {
    fontSize: 20,
    color: '#CCCCCC',
    fontWeight: '300',
  },
});