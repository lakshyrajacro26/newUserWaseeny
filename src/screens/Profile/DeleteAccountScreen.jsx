import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ReasonSheetModal from '../../components/ReasonSheetModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import { deleteAccount } from '../../services/userService';

const checklist = [
  {
    id: '1',
    title: 'Pending Orders',
    desc: 'Make sure you don’t have any active or pending deliveries.',
  },
  {
    id: '2',
    title: 'Saved Addresses & Payment Methods',
    desc: 'These will be permanently erased.',
  },
  {
    id: '3',
    title: 'Order History',
    desc: 'You will lose access to past receipts and order details.',
  },
  {
    id: '4',
    title: 'Wallet / Credits / Coupons',
    desc: 'Any remaining balance, discounts, or rewards will be lost.',
  },
  {
    id: '5',
    title: 'Recovery',
    desc: 'Once deleted, your account and data cannot be restored.',
  },
];

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
    useHideTabBar(navigation);
  const [reasonVisible, setReasonVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reasons = useMemo(
    () => [
      'I’m taking a break from this platform',
      'I don’t find the service useful anymore',
      'I’m concerned about my privacy',
      'I created a duplicate account',
      'I’m not satisfied with the customer support',
      'I didn’t get the results I expected',
      'I found an alternative service I prefer',
      'Technical issues or bugs',
      'Other (Please specify)',
    ],
    [],
  );
  const handleDeleteAccount = async () => {
    if (!selectedReason) return;

    setIsDeleting(true);
    try {
      await deleteAccount(selectedReason);
      // Navigate to completion screen after successful deletion
      navigation.navigate('DeletionComplete');
    } catch (error) {
      console.error('Error deleting account:', error);
      Toast.show({
        type: 'topError',
        text1: 'Error',
        text2: error?.response?.data?.message || 'Failed to delete account. Please try again.',
        position: 'top',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const renderItem = ({ item }) => (
    <View style={styles.pointRow}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.pointText}>
        <Text style={styles.pointTitle}>{item.title}</Text>
        <Text style={styles.pointDesc}> — {item.desc}</Text>
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../assets/icons/Backarrow.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Avatar */}
        <Image
          source={require('../../assets/icons/user.png')}
          style={styles.avatar}
        />

        <Text style={styles.name}>Sophia Thomas</Text>

        <Text style={styles.subText}>
          Help us understand why you’re deactivating your account.
        </Text>

        <Text style={styles.label}>Reason*</Text>

        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setReasonVisible(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownText,
              selectedReason && styles.dropdownTextSelected,
            ]}
          >
            {selectedReason || 'Select Reason'}
          </Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Things to Check Before Deleting an Account:
        </Text>

        <FlatList
          data={checklist}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
        />

        <TouchableOpacity
          style={[
            styles.deleteBtn,
            (!selectedReason || isDeleting) && styles.deleteBtnDisabled,
          ]}
          disabled={!selectedReason || isDeleting}
          onPress={handleDeleteAccount}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={[
                styles.deleteText,
                !selectedReason && styles.deleteTextDisabled,
              ]}
            >
              Delete Account
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ReasonSheetModal
        visible={reasonVisible}
        reasons={reasons}
        selectedReason={selectedReason}
        onSelect={reason => {
          setSelectedReason(reason);
          setReasonVisible(false);
        }}
        onClose={() => setReasonVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  /* HEADER */
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },

  headerSpacer: {
    width: 22,
    height: 22,
  },

  /* AVATAR */
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: 'center',
    marginTop: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    alignSelf: 'center',
    marginTop: 8,
  },

  subText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    // textAlign: 'center',
    fontWeight:'600',
    marginTop: 14,
    // marginHorizontal: 24,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginTop: 14,
  },

  /* DROPDOWN */
  dropdown: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  dropdownTextSelected: {
    color: '#111827',
  },
  arrow: {
    fontSize: 20,
    color: '#9CA3AF',
    marginBottom: 2,
  },

  /* SECTION */
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 6,
  },

  list: {
    paddingBottom: 16,
  },

  pointRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 22,
    marginRight: 6,
    lineHeight: 20,
  },
  pointText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#374151',
  },
  pointTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  pointDesc: {
    fontWeight: '400',
    color: '#6B7280',
  },

  /* BUTTON */
  deleteBtn: {
    height: 48,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  deleteBtnDisabled: {
    backgroundColor: '#FCA5A5',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteTextDisabled: {
    color: '#FFF5F5',
  },
});
