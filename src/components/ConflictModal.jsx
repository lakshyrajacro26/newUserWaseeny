import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export const ConflictModal = ({
  visible,
  currentRestaurant,
  newRestaurant,
  onPlaceOrder,
  onFreshCart,
  loading,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Prevent closing by back button
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Different Restaurant</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>
              Your cart has items from <Text style={styles.bold}>"{currentRestaurant?.name}"</Text>.
            </Text>
            <Text style={[styles.message, styles.marginTop]}>
              You're trying to add from <Text style={styles.bold}>"{newRestaurant?.name}"</Text>.
            </Text>
            <Text style={[styles.question, styles.marginTop]}>
              What would you like to do?
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onPlaceOrder}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>
                Continue Current Order
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.freshButton]}
              onPress={onFreshCart}
              disabled={loading}
            >
              <Text style={styles.freshButtonText}>
                {loading ? 'Processing...' : 'Fresh Cart'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Clearing your cart will remove all current items.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    backgroundColor: '#FF3D3D',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    fontWeight: '400',
  },
  bold: {
    fontWeight: '700',
    color: '#000',
  },
  marginTop: {
    marginTop: 12,
  },
  question: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginTop: 16,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  freshButton: {
    backgroundColor: '#FF3D3D',
  },
  freshButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
