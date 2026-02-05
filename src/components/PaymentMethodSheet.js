import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ICONS = {
  googlepay: require('../assets/icons/googlepay.png'),
  paypal: require('../assets/icons/paypal.png'),
};

const METHODS = {
  cards: [
    { id: 'credit', label: 'Credit Card' },
    { id: 'debit', label: 'Debit Card' },
  ],
  upi: [
    { id: 'gpay_upi', label: 'Google Pay UPI', icon: ICONS.googlepay },
    { id: 'phonepe_upi', label: 'PhonePe UPI', icon: ICONS.paypal },
  ],
  cod: { id: 'cod', label: 'Cash on Delivery' },
};

export default function PaymentMethodSheet({
  visible,
  selectedId,
  onClose,
  onApply,
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [localId, setLocalId] = useState(selectedId ?? null);

  const list = useMemo(() => METHODS, []);

  useEffect(() => {
    if (!visible) return;
    setLocalId(selectedId ?? null);
  }, [selectedId, visible]);

  useEffect(() => {
    if (!visible) return undefined;

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        stiffness: 220,
        damping: 28,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();

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

  const canApply = !!localId;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        // Disable back
      }}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={styles.closeFloating}
          >
            <Text style={styles.closeFloatingText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Payment Method</Text>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.groupCard}>
              <Text style={styles.groupTitle}>Cards</Text>
              {list.cards.map((m, idx) => {
                const selected = m.id === localId;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.groupRow,
                      idx === list.cards.length - 1 && styles.groupRowLast,
                    ]}
                    onPress={() => setLocalId(m.id)}
                    activeOpacity={0.9}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        selected && styles.radioOuterActive,
                      ]}
                    >
                      {selected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.label}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupTitle}>UPI</Text>
              {list.upi.map((m, idx) => {
                const selected = m.id === localId;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.groupRow,
                      idx === list.upi.length - 1 && styles.groupRowLast,
                    ]}
                    onPress={() => setLocalId(m.id)}
                    activeOpacity={0.9}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        selected && styles.radioOuterActive,
                      ]}
                    >
                      {selected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.iconWrap}>
                      <Image source={m.icon} style={styles.icon} />
                    </View>
                    <Text style={styles.label}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.codRow}
              onPress={() => setLocalId(list.cod.id)}
              activeOpacity={0.9}
            >
              <View
                style={[
                  styles.radioOuter,
                  localId === list.cod.id && styles.radioOuterActive,
                ]}
              >
                {localId === list.cod.id && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.label}>{list.cod.label}</Text>
            </TouchableOpacity>

            <View style={{ height: 96 }} />
          </ScrollView>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={() => {
                if (!canApply) return;
                const selected =
                  list.cards.find(x => x.id === localId) ||
                  list.upi.find(x => x.id === localId) ||
                  (list.cod.id === localId ? list.cod : null);
                if (!selected) return;
                onApply?.(selected);
              }}
              style={[
                styles.primaryBtn,
                !canApply && styles.primaryBtnDisabled,
              ]}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.82,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '900', color: '#111' },
  closeFloating: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeFloatingText: {
    fontSize: 18,
    color: '#111',
  },
  content: { padding: 16 },

  groupCard: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    marginBottom: 14,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  groupRowLast: { borderBottomWidth: 0 },

  codRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFF',
    marginBottom: 16,
  },

  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  icon: { width: 18, height: 18, resizeMode: 'contain' },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterActive: { borderColor: '#FF3D3D' },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF3D3D',
  },
  label: { fontWeight: '700', color: '#111', fontSize: 13 },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#EEE',
    padding: 16,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FF3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});
