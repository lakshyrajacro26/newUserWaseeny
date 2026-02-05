import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DeleteAccountPopUp = ({ visible, onClose, onDelete }) => {
  const navigation = useNavigation();

  const handleNavigateDelete = () => {
    if (typeof onClose === 'function') {
      onClose();
    }

    setTimeout(() => {
      navigation.navigate('DeleteAccountScreen');
    }, 0);
  };
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container} edges={['top','bottom']}>
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Trash2 size={22} color={"#E41C26"} />
            </View>
            <View>
              {/* Title */}
              <TouchableOpacity onPress={handleNavigateDelete}>

                <Text style={styles.title}>Delete Account</Text>
              </TouchableOpacity>

              {/* Message */}
              <Text style={styles.message}>
                Are you sure you want to Delete an account
              </Text>
            </View>
          </View>
          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default DeleteAccountPopUp;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },

  closeBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
  },

  closeText: {
    fontSize: 18,
    color: '#9E9E9E',
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  icon: {
    fontSize: 22,
    color: '#E41C26',
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1C',
  },

  message: {
    fontSize: 13,
    color: '#8E8E8E',
    marginTop: 6,
  },

  actions: {
    flexDirection: 'row',
    marginTop: 22,
  },

  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },

  cancelText: {
    fontSize: 14,
    color: '#1C1C1C',
  },

  deleteBtn: {
    flex: 1,
    backgroundColor: '#E41C26',
    borderRadius: 10,
    paddingVertical: 10,
    marginLeft: 8,
    alignItems: 'center',
  },

  deleteText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
