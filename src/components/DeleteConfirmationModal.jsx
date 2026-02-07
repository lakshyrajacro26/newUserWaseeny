import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  BackHandler,
} from 'react-native';

const { width } = Dimensions.get('window');

export const DeleteConfirmationModal = ({
  visible,
  itemName,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const [shouldRender, setShouldRender] = React.useState(false);

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return undefined;
    }

    // Reset to initial state
    overlayOpacity.setValue(0);
    scale.setValue(0.8);
    
    // Wait for next frame before rendering and animating
    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            stiffness: 220,
            damping: 20,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, [visible, overlayOpacity, scale]);

  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Remove Item</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>
              Are you sure you want to remove{'\n'}
              <Text style={styles.itemNameText}>"{itemName}"</Text>
              {'\n'}from your cart?
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isDeleting}
            >
              <Text style={styles.cancelButtonText}>Keep Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={onConfirm}
              disabled={isDeleting}
            >
              <Text style={styles.deleteButtonText}>
                {isDeleting ? 'Removing...' : 'Remove Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 350,
    backgroundColor: '#fff',
    borderRadius: 16,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    fontWeight: '400',
    textAlign: 'center',
  },
  itemNameText: {
    fontWeight: '700',
    color: '#000',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
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
  deleteButton: {
    backgroundColor: '#FF3D3D',
  },
  deleteButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
