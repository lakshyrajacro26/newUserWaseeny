import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AddressSheet({
  visible,
  addresses,
  selectedAddressId,
  onSelect,
  onApply,
  onAddAddress,
  onClose,
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const list = useMemo(
    () => (Array.isArray(addresses) ? addresses : []),
    [addresses],
  );

  const [localSelectedId, setLocalSelectedId] = useState(
    selectedAddressId ?? null,
  );
  const [localList, setLocalList] = useState(list);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLine, setNewLine] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLocalSelectedId(selectedAddressId ?? null);
    setLocalList(list);
    setIsAdding(false);
    setNewLabel('');
    setNewLine('');
  }, [list, selectedAddressId, visible]);

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

  const canApply = !!localSelectedId;
  const canSave = newLine.trim().length > 0;

  const handleSaveAddress = () => {
    if (!canSave) return;
    const created = {
      id: `addr_${Date.now()}`,
      label: newLabel.trim() || 'Other',
      addressLine: newLine.trim(),
    };
    setLocalList(prev => [created, ...prev]);
    setLocalSelectedId(created.id);
    onSelect?.(created);
    setIsAdding(false);
    setNewLabel('');
    setNewLine('');
  };

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
          <View style={styles.header}>
            <Text style={styles.title}>Delivery address</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {isAdding ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Add new address</Text>
                <TextInput
                  value={newLabel}
                  onChangeText={setNewLabel}
                  placeholder="Label (e.g. Home)"
                  placeholderTextColor="#9A9A9A"
                  style={styles.input}
                />
                <TextInput
                  value={newLine}
                  onChangeText={setNewLine}
                  placeholder="Address"
                  placeholderTextColor="#9A9A9A"
                  style={[styles.input, styles.inputMultiline]}
                  multiline
                />
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setIsAdding(false);
                      setNewLabel('');
                      setNewLine('');
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                    onPress={handleSaveAddress}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : localList.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No saved addresses</Text>
                <Text style={styles.emptySub}>
                  Add an address to continue checkout.
                </Text>

                <TouchableOpacity
                  style={styles.addAddressBtn}
                  onPress={() => setIsAdding(true)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.addAddressText}>+ Add new address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {localList.map(addr => {
                  const selected = addr.id === localSelectedId;
                  return (
                    <TouchableOpacity
                      key={addr.id}
                      activeOpacity={0.9}
                      style={[styles.card, selected && styles.cardSelected]}
                      onPress={() => {
                        setLocalSelectedId(addr.id);
                        onSelect?.(addr);
                      }}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          selected && styles.radioOuterActive,
                        ]}
                      >
                        {selected && <View style={styles.radioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addrLabel}>
                          {addr.label || 'Address'}
                        </Text>
                        <Text numberOfLines={2} style={styles.addrLine}>
                          {addr.addressLine}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.addInline}
                  onPress={() => setIsAdding(true)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.addInlineText}>+ Add new address</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 96 }} />
          </ScrollView>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={() => {
                if (!canApply) return;
                const selected = localList.find(a => a.id === localSelectedId);
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
    maxHeight: SCREEN_HEIGHT * 0.86,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  title: { fontSize: 16, fontWeight: '900', color: '#111' },
  close: {
    fontSize: 18,
    color: '#666',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  content: { padding: 16 },

  formCard: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    paddingHorizontal: 12,
    color: '#111',
    fontSize: 13,
    marginBottom: 10,
  },
  inputMultiline: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  cancelText: { color: '#111', fontWeight: '700', fontSize: 12 },
  saveBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3D3D',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

  emptyWrap: { paddingVertical: 26, alignItems: 'center' },
  emptyTitle: { fontWeight: '900', color: '#111', fontSize: 16 },
  emptySub: {
    marginTop: 8,
    color: '#777',
    fontWeight: '600',
    textAlign: 'center',
  },
  addAddressBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF3D3D',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddressText: { color: '#FF3D3D', fontWeight: '900' },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  cardSelected: { borderColor: '#FF3D3D', backgroundColor: '#FFF1F1' },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioOuterActive: { borderColor: '#FF3D3D' },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF3D3D',
  },
  addrLabel: { fontWeight: '900', color: '#111', fontSize: 13 },
  addrLine: {
    marginTop: 4,
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 18,
  },

  addInline: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addInlineText: { color: '#FF3D3D', fontWeight: '900' },

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
