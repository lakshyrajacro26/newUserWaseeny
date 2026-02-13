import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OrderConfirmedModal({
  visible,
  orderId,
  onViewDetails,
  onExploreMenu,
  status = 'success',
  errorMessage,
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(false);

  const safeOrderId = useMemo(() => orderId || '—', [orderId]);
  const isSuccess = status === 'success';
  const isFailed = status === 'failed';

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return undefined;
    }

   
    overlayOpacity.setValue(0);
    translateY.setValue(SCREEN_HEIGHT);
    
    
    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            stiffness: 220,
            damping: 26,
            mass: 0.9,
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
  }, [overlayOpacity, translateY, visible]);

  useEffect(() => {
    if (visible) return;
    overlayOpacity.setValue(0);
    translateY.setValue(SCREEN_HEIGHT);
  }, [overlayOpacity, translateY, visible]);

  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
       
      }}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.content}>
            <View style={[styles.celebrateWrap, isFailed && styles.errorWrap]}>
              <Text style={styles.celebrateIcon}>{isSuccess ? '🎉' : '❌'}</Text>
            </View>

            <Text style={styles.title}>{isSuccess ? 'Order Confirmed' : 'Order Failed'}</Text>
            <Text style={styles.subtitle}>
              {isSuccess
                ? 'Your order has been placed successfully. You can track the order status and details anytime.'
                : errorMessage || 'Unable to place your order. Please try again or contact support.'}
            </Text>

            {isSuccess && (
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>Order ID : </Text>
                <Text style={styles.badgeValue}>{safeOrderId}</Text>
              </View>
            )}

            <View style={styles.buttonStack}>
              {isSuccess ? (
                <>
                  <Pressable
                    onPress={onViewDetails}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.primaryText}>View Booking Details</Text>
                  </Pressable>

                  <Pressable
                    onPress={onExploreMenu}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.secondaryText}>Explore Other Menu</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={onViewDetails}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.primaryText}>Try Again</Text>
                  </Pressable>

                  <Pressable
                    onPress={onExploreMenu}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.secondaryText}>Go Back</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.62,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 34,
  },
  celebrateWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF1F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorWrap: {
    backgroundColor: '#FFE5E5',
  },
  celebrateIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  badge: {
    marginTop: 18,
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
    display:'flex',
    flexDirection:'row'
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3D3D',
    marginRight:4
  },
  badgeValue: {
    // marginTop: 4,
    fontSize: 12,
    fontWeight: '900',
    color: '#FF3D3D',
  },
  buttonStack: {
    width: '100%',
    marginTop: 28,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryText: {
    color: '#FF3D3D',
    fontWeight: '900',
    fontSize: 14,
  },
  btnPressed: {
    opacity: 0.9,
  },
});
