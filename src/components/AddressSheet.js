import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  BackHandler,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  ToastAndroid,
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
  onUpdateAddress,
  onDeleteAddress,
  onClose,
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(false);

  const list = useMemo(
    () => (Array.isArray(addresses) ? addresses : []),
    [addresses],
  );

  const [localSelectedId, setLocalSelectedId] = useState(
    selectedAddressId ?? null,
  );
  const [localList, setLocalList] = useState(list);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [newLine, setNewLine] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newZip, setNewZip] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setIsSaving(false);
    setLocalSelectedId(selectedAddressId ?? null);
    setLocalList(list);
    setIsAdding(false);
    setEditingId(null);
    setNewLabel('');
    setNewLine('');
    setNewCity('');
    setNewZip('');
    setNewInstructions('');
    setNewLat('');
    setNewLng('');
    setNewIsDefault(false);
  }, [list, selectedAddressId, visible]);

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return undefined;
    }

    // Reset to initial position
    overlayOpacity.setValue(0);
    translateY.setValue(SCREEN_HEIGHT);
    
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
          Animated.spring(translateY, {
            toValue: 0,
            stiffness: 220,
            damping: 28,
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

  const canApply = !!localSelectedId;
  const canSave = newLine.trim().length > 0 && newCity.trim().length > 0;

  const handleSaveAddress = async () => {
    if (!canSave || isSaving) return;
    const lat = Number(newLat);
    const lng = Number(newLng);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    const payload = {
      label: newLabel.trim() || 'Other',
      addressLine: newLine.trim(),
      city: newCity.trim(),
      zipCode: newZip.trim(),
      deliveryInstructions: newInstructions.trim() || undefined,
      isDefault: !!newIsDefault,
      location: hasCoords
        ? { type: 'Point', coordinates: [lng, lat] }
        : undefined,
    };

    setIsSaving(true);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        let nextList = localList;
        if (editingId) {
          const response = await onUpdateAddress?.(editingId, payload);
          nextList = response || localList;
        } else {
          const response = await onAddAddress?.(payload);
          nextList = response || localList;
        }

        if (Array.isArray(nextList) && nextList.length > 0) {
          setLocalList(nextList);
          const selectedId = editingId || nextList[0]?.id || null;
          if (selectedId) {
            setLocalSelectedId(selectedId);
            const selected = nextList.find(a => a.id === selectedId);
            if (selected) onSelect?.(selected);
          }
        }
      } finally {
        setIsSaving(false);
        setIsAdding(false);
        setEditingId(null);
        setNewLabel('');
        setNewLine('');
        setNewCity('');
        setNewZip('');
        setNewInstructions('');
        setNewLat('');
        setNewLng('');
        setNewIsDefault(false);
      }
    }, 350);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setNewLabel('');
    setNewLine('');
    setNewCity('');
    setNewZip('');
    setNewInstructions('');
    setNewLat('');
    setNewLng('');
    setNewIsDefault(false);
  };

  const startEdit = addr => {
    setIsAdding(true);
    setEditingId(addr?.id || null);
    setNewLabel(addr?.label || '');
    setNewLine(addr?.addressLine || '');
    setNewCity(addr?.city || '');
    setNewZip(addr?.zipCode || '');
    setNewInstructions(addr?.deliveryInstructions || '');
    const coords = addr?.location?.coordinates || [];
    setNewLng(coords[0] != null ? String(coords[0]) : '');
    setNewLat(coords[1] != null ? String(coords[1]) : '');
    setNewIsDefault(!!addr?.isDefault);
  };

  const handleDelete = async addr => {
    if (!addr?.id) return;
    try {
      const response = await onDeleteAddress?.(addr.id);
      const nextList = response || localList.filter(x => x.id !== addr.id);
      setLocalList(nextList);
      if (String(localSelectedId) === String(addr.id)) {
        setLocalSelectedId(null);
      }
      const message = response?.message || 'Address removed';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', message);
      }
    } catch (error) {
      const message = error?.message || 'Failed to remove address';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  if (!shouldRender) return null;

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
                <Text style={styles.formTitle}>
                  {editingId ? 'Edit address' : 'Add new address'}
                </Text>
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
                <TextInput
                  value={newCity}
                  onChangeText={setNewCity}
                  placeholder="City"
                  placeholderTextColor="#9A9A9A"
                  style={styles.input}
                />
                <TextInput
                  value={newZip}
                  onChangeText={setNewZip}
                  placeholder="ZIP code"
                  placeholderTextColor="#9A9A9A"
                  style={styles.input}
                />
                <TextInput
                  value={newInstructions}
                  onChangeText={setNewInstructions}
                  placeholder="Delivery instructions"
                  placeholderTextColor="#9A9A9A"
                  style={[styles.input, styles.inputMultiline]}
                  multiline
                />
                <View style={styles.coordRow}>
                  <TextInput
                    value={newLat}
                    onChangeText={setNewLat}
                    placeholder="Latitude"
                    placeholderTextColor="#9A9A9A"
                    style={[styles.input, styles.inputHalf]}
                  />
                  <TextInput
                    value={newLng}
                    onChangeText={setNewLng}
                    placeholder="Longitude"
                    placeholderTextColor="#9A9A9A"
                    style={[styles.input, styles.inputHalf]}
                  />
                </View>
                <View style={styles.defaultRow}>
                  <Text style={styles.defaultLabel}>Set as default</Text>
                  <Switch
                    value={newIsDefault}
                    onValueChange={setNewIsDefault}
                    trackColor={{ false: '#D9D9D9', true: '#D9D9D9' }}
                    thumbColor={newIsDefault ? '#111' : '#FFF'}
                  />
                </View>
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      if (saveTimerRef.current) {
                        clearTimeout(saveTimerRef.current);
                        saveTimerRef.current = null;
                      }
                      setIsSaving(false);
                      setIsAdding(false);
                      setEditingId(null);
                      setNewLabel('');
                      setNewLine('');
                      setNewCity('');
                      setNewZip('');
                      setNewInstructions('');
                      setNewLat('');
                      setNewLng('');
                      setNewIsDefault(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      (!canSave || isSaving) && styles.saveBtnDisabled,
                    ]}
                    onPress={handleSaveAddress}
                    activeOpacity={0.9}
                    disabled={!canSave || isSaving}
                  >
                    <Text style={styles.saveText}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Text>
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
                  onPress={startAdd}
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
                        {!!addr.city && (
                          <Text numberOfLines={1} style={styles.addrMeta}>
                            {addr.city} {addr.zipCode ? `- ${addr.zipCode}` : ''}
                          </Text>
                        )}
                        <View style={styles.addrActions}>
                          <TouchableOpacity
                            style={styles.addrActionBtn}
                            onPress={() => startEdit(addr)}
                            activeOpacity={0.9}
                          >
                            <Text style={styles.addrActionText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.addrActionBtn}
                            onPress={() => handleDelete(addr)}
                            activeOpacity={0.9}
                          >
                            <Text style={styles.addrActionDelete}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.addInline}
                  onPress={startAdd}
                  activeOpacity={0.9}
                >
                  <Text style={styles.addInlineText}>+ Add new address</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 96 }} />
          </ScrollView>

          {!isAdding && (
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
          )}
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
  inputHalf: {
    flex: 1,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 10,
  },
  defaultRow: {
    marginTop: 2,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultLabel: { fontSize: 12, fontWeight: '700', color: '#111' },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    height: 42,
    minWidth: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DADADA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  cancelText: { color: '#111', fontWeight: '800', fontSize: 12 },
  saveBtn: {
    paddingHorizontal: 16,
    height: 42,
    minWidth: 110,
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
  addrMeta: {
    marginTop: 4,
    color: '#777',
    fontWeight: '600',
    fontSize: 11,
  },
  addrActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
  },
  addrActionBtn: {
    paddingVertical: 2,
  },
  addrActionText: { color: '#111', fontWeight: '700', fontSize: 12 },
  addrActionDelete: { color: '#E53935', fontWeight: '700', fontSize: 12 },

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
