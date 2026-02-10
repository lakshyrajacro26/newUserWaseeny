import React, { useMemo, useState, useEffect, useRef } from 'react';
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
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const { width } = Dimensions.get('window');

// Cache timeout (30 seconds)
const CACHE_TIMEOUT = 30000;

function ProfileHome() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Cache ref to track last fetch time
  const lastFetchTimeRef = useRef(null);

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
  
  // Fetch user profile - with caching to prevent repeated API calls
  const fetchUserProfile = async (bypassCache = false) => {
    const now = Date.now();
    
    // Check if data is already cached and fresh
    if (!bypassCache && lastFetchTimeRef.current && (now - lastFetchTimeRef.current) < CACHE_TIMEOUT) {
      return; // Data is fresh, skip API call
    }
    
    try {
      setIsLoadingProfile(true);
      const response = await apiClient.get(USER_ROUTES.profile);
      const user = response?.data?.user || response?.data;
      setUserData(user);
      lastFetchTimeRef.current = now; // Update cache timestamp
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
  // But use cache to prevent bar-bar API calls
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile(); // bypassCache = false (default), so uses cache
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
              onPress={() => navigation.navigate('AddressesScreen')}
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

export default React.memo(ProfileHome);

const MenuItem = React.memo(({ title, onPress, isLast }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    style={[styles.menuItem, isLast && styles.menuItemLast]}
    onPress={onPress}
  >
    <Text style={styles.menuItemText}>{title}</Text>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
));

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  scrollContent: {
    paddingBottom: SPACING.lg,
  },

  /* Header */
  header: {
    backgroundColor: '#E41C26',
    paddingTop: scale(60),
    paddingBottom: SPACING.lg,
    height: hp(20),
    alignItems: 'center',
    borderBottomLeftRadius: scale(24),
    borderBottomRightRadius: scale(24),
  },

  avatarWrapper: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  avatar: {
    width: scale(74),
    height: scale(74),
    borderRadius: scale(37),
  },

  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#000',
  },

  phone: {
    fontSize: FONT_SIZES.xs,
    color: '#000',
    marginTop: scale(4),
    opacity: 0.9,
  },

  ImageContainer: {
    marginTop: scale(-58),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  /* Quick Actions */
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    zIndex: 10,
  },

  quickActionCard: {
    flex: 1,
    marginTop: scale(20),
    backgroundColor: '#FDF8F8',
    borderRadius: scale(12),
    paddingVertical: scale(8),
    alignItems: 'center',
    justifyContent:'center',
    borderWidth: 1,
    borderColor: '#00000024',
    flexDirection:'row'
  },

  iconCircle: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom: 8,
  },

  quickActionText: {
    fontSize: FONT_SIZES.xs,
    color: '#333333',
    fontWeight: '600',
  },

  /* Wallet Card */
  walletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FDF8F8',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#00000024'
  },

  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  walletText: {
    fontSize: FONT_SIZES.sm,
    color: '#333333',
    fontWeight: '600',
  },

  walletAmount: {
    fontSize: FONT_SIZES.sm,
    color: '#E41C26',
    fontWeight: '700',
  },

  /* Sections */
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    color: '#999999',
    fontWeight: '600',
    marginBottom: SPACING.xs,
    marginLeft: scale(4),
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00000024'
  },

  /* Menu Items */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  menuItemLast: {
    borderBottomWidth: 0,
  },

  menuItemText: {
    fontSize: FONT_SIZES.sm,
    color: '#333333',
    fontWeight: '500',
  },

  chevron: {
    fontSize: FONT_SIZES.lg,
    color: '#CCCCCC',
    fontWeight: '300',
  },
});