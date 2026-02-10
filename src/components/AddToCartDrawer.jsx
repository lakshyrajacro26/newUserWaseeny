import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Toast from 'react-native-toast-message';
import { CartContext } from '../context/CartContext';
import { buildCartLineId } from '../services/cartPricing';
import { debounceAsync } from '../utils/debounce';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function normalizeFlavors(item) {
  const raw =
    item?.flavors ||
    item?.flavourOptions ||
    item?.variants ||
    item?.options?.flavors ||
    item?.options?.flavours ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw
    .map((f, idx) => {
      if (typeof f === 'string') {
        return { id: String(idx), label: f, priceDelta: 0 };
      }
      if (f && typeof f === 'object') {
        const nameValue =
          typeof f.name === 'string'
            ? f.name
            : f.name?.en || f.name?.ar || f.name?.de;
        return {
          id: String(f.id ?? idx),
          label: String(f.label ?? f.title ?? nameValue ?? `Option ${idx + 1}`),
          priceDelta: toNumber(f.priceDelta ?? f.extraPrice ?? f.price ?? 0, 0),
        };
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeFrequentlyBought(item) {
  const raw =
    item?.frequentlyBoughtTogether ||
    item?.frequentlyBought ||
    item?.addons ||
    item?.addOns ||
    item?.extras ||
    item?.options?.frequentlyBoughtTogether ||
    item?.options?.addons ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw
    .map((x, idx) => {
      if (typeof x === 'string') {
        return { id: String(idx), label: x, price: 0 };
      }
      if (x && typeof x === 'object') {
        const nameValue =
          typeof x.name === 'string'
            ? x.name
            : x.name?.en || x.name?.ar || x.name?.de;
        return {
          id: String(x.id ?? idx),
          label: String(x.label ?? x.title ?? nameValue ?? `Item ${idx + 1}`),
          price: toNumber(x.price ?? x.extraPrice ?? 0, 0),
        };
      }
      return null;
    })
    .filter(Boolean);
}

export default function AddToCartDrawer({
  visible,
  item,
  restaurant,
  onClose,
  currencySymbol = '₹',
  onAddToCart,
}) {
  const sheetHeight = SCREEN_HEIGHT * 0.85;

  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const openedAtRef = useRef(0);
  const [shouldRender, setShouldRender] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedFlavorId, setSelectedFlavorId] = useState(null);
  const [selectedTogetherIds, setSelectedTogetherIds] = useState(
    () => new Set(),
  );
  const [notes, setNotes] = useState('');
  const [showAllFlavors, setShowAllFlavors] = useState(false);
  const [showAllTogether, setShowAllTogether] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToCart, freshCartResolvedAt } = useContext(CartContext);

  const basePrice = useMemo(() => toNumber(item?.price ?? 0, 0), [item]);
  const flavors = useMemo(() => normalizeFlavors(item), [item]);
  const frequentlyBought = useMemo(
    () => normalizeFrequentlyBought(item),
    [item],
  );

  useEffect(() => {
    if (!visible) return;

    // Reset when opening / switching items
    setQuantity(1);
    setNotes('');
    setSelectedTogetherIds(new Set());
    setIsSubmitting(false);

    const defaultFlavorId = flavors[0]?.id ?? null;
    setSelectedFlavorId(defaultFlavorId);
    setShowAllFlavors(false);
    setShowAllTogether(false);
  }, [visible, item, flavors]);

  useEffect(() => {
    if (!visible) return;
    if (freshCartResolvedAt) {
      onClose?.();
    }
  }, [freshCartResolvedAt, visible, onClose]);

  const selectedFlavor = useMemo(() => {
    if (!selectedFlavorId) return null;
    return flavors.find(f => f.id === selectedFlavorId) ?? null;
  }, [flavors, selectedFlavorId]);

  const selectedTogetherTotal = useMemo(() => {
    if (!frequentlyBought.length || !selectedTogetherIds?.size) return 0;
    let total = 0;
    for (const extra of frequentlyBought) {
      if (selectedTogetherIds.has(extra.id)) total += toNumber(extra.price, 0);
    }
    return total;
  }, [frequentlyBought, selectedTogetherIds]);

  const perUnitTotal = useMemo(() => {
    const flavorDelta = selectedFlavor
      ? toNumber(selectedFlavor.priceDelta, 0)
      : 0;
    return basePrice + flavorDelta + selectedTogetherTotal;
  }, [basePrice, selectedFlavor, selectedTogetherTotal]);

  const totalPrice = useMemo(
    () => perUnitTotal * Math.max(1, quantity),
    [perUnitTotal, quantity],
  );

  const animateOpen = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateClose = cb => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) cb?.();
    });
  };

  useEffect(() => {
    if (!visible) {
      setShouldRender(false);
      return;
    }

    openedAtRef.current = Date.now();
    // Reset to initial position
    translateY.setValue(sheetHeight);
    overlayOpacity.setValue(0);
    
    // Wait for next frame before rendering and animating
    requestAnimationFrame(() => {
      setShouldRender(true);
      requestAnimationFrame(() => {
        animateOpen();
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const requestClose = () => {
    if (!visible) return;

    // Block accidental close caused by the same tap that opened the modal.
    if (Date.now() - openedAtRef.current < 280) return;

    animateClose(onClose);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const { dy, dx } = gesture;
          // Vertical swipe with some intent.
          return Math.abs(dy) > 6 && Math.abs(dy) > Math.abs(dx);
        },
        onPanResponderMove: (_, gesture) => {
          const dy = Math.max(0, gesture.dy);
          translateY.setValue(dy);
        },
        onPanResponderRelease: (_, gesture) => {
          const dy = Math.max(0, gesture.dy);
          const vy = gesture.vy;

          const shouldClose = dy > 120 || vy > 1.2;
          if (shouldClose) {
            requestClose();
          } else {
            Animated.timing(translateY, {
              toValue: 0,
              duration: 180,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    // translateY is stable (ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const toggleTogether = id => {
    setSelectedTogetherIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const decQty = () => setQuantity(q => Math.max(1, q - 1));
  const incQty = () => setQuantity(q => Math.min(99, q + 1));

  const handleAdd = useMemo(() => {
    return debounceAsync(async () => {
      if (!item || isSubmitting) return;

      setIsSubmitting(true);
      try {
        const addOns = frequentlyBought.filter(x => selectedTogetherIds.has(x.id));

        const cartItem = {
          menuItemId: item?.id,
          productId: item?.id,
          name: item?.name,
          image: item?.image,
          basePrice,
          selectedFlavor,
          addOns,
          quantity,
          totalPrice,
          notes,
          restaurantId: restaurant?.id || restaurant?._id,
          restaurantName: restaurant?.name?.en || restaurant?.name,
          restaurant,
        };

        console.log('📦 AddToCartDrawer: Submitting item with debounce:', cartItem.name);
        const result = await addToCart?.(cartItem);
        
        console.log('📥 AddToCartDrawer: API result:', result);
        
        // If conflict, context handles the modal
        if (result?.conflict) {
          console.log('⚠️ AddToCartDrawer: Conflict detected, drawer will stay open');
          setIsSubmitting(false);
          return;
        }

        // Close drawer on success
        if (result?.success || !result?.error) {
          console.log('✅ AddToCartDrawer: Item added successfully, closing drawer');
          onAddToCart?.();
          requestClose();
        } else {
          console.error('❌ AddToCartDrawer: Failed to add item');
          Toast.show({
            type: 'topError',
            text1: 'Error',
            text2: 'Failed to add item to cart',
            position: 'top',
          });
        }
      } catch (error) {
        console.error('❌ AddToCartDrawer: Error adding to cart:', error?.message);
        Toast.show({
          type: 'topError',
          text1: 'Error',
          text2: error?.message || 'Failed to add item to cart',
          position: 'top',
        });
      } finally {
        setIsSubmitting(false);
      }
    }, 500); // 500ms debounce
  }, [item, isSubmitting, frequentlyBought, selectedTogetherIds, basePrice, selectedFlavor, quantity, totalPrice, notes, restaurant, addToCart, onAddToCart, requestClose]);

  const itemImageSource =
    item?.image != null && String(item.image).length
      ? { uri: String(item.image) }
      : require('../assets/images/Food.png');

  const initialFlavorCount = 5;
  const initialTogetherCount = 4;

  const visibleFlavors = showAllFlavors
    ? flavors
    : flavors.slice(0, initialFlavorCount);

  const hiddenFlavorCount = Math.max(0, flavors.length - visibleFlavors.length);

  const visibleTogether = showAllTogether
    ? frequentlyBought
    : frequentlyBought.slice(0, initialTogetherCount);

  const hiddenTogetherCount = Math.max(
    0,
    frequentlyBought.length - visibleTogether.length,
  );

  if (!visible) return null;
  if (!shouldRender) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
        </Animated.View>

        <Pressable style={styles.closeFab} onPress={requestClose}>
          <Text style={styles.closeFabText}>×</Text>
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleWrap} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <View style={styles.content}>
            {/* Image Card */}
            <View style={styles.heroCard}>
              <Image source={itemImageSource} style={styles.heroImage} />
            </View>

            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={styles.foodName}>
                  {item?.name}
                </Text>
                {!!item?.description && (
                  <Text numberOfLines={2} style={styles.foodDesc}>
                    {item?.description}
                  </Text>
                )}
              </View>

              <Pressable style={styles.heartBtn}>
                <Text style={styles.heartText}>♡</Text>
              </Pressable>
            </View>

            {/* Flavor (radio) */}
            {flavors.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Choice of Flavor</Text>
                  <Text style={styles.sectionHint}>(Required)</Text>
                </View>

                {visibleFlavors.map(f => {
                  const selected = f.id === selectedFlavorId;
                  return (
                    <Pressable
                      key={f.id}
                      style={styles.optionRow}
                      onPress={() => setSelectedFlavorId(f.id)}
                    >
                      <Text style={styles.optionLabel}>{f.label}</Text>
                      <View style={styles.optionRight}>
                        {toNumber(f.priceDelta, 0) > 0 && (
                          <Text style={styles.optionPrice}>
                            + {currencySymbol}
                            {toNumber(f.priceDelta, 0)}
                          </Text>
                        )}
                        <View
                          style={[
                            styles.radioOuter,
                            selected && styles.radioOuterActive,
                          ]}
                        >
                          {selected && <View style={styles.radioInner} />}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}

                {hiddenFlavorCount > 0 && (
                  <Pressable
                    style={styles.viewMoreBtn}
                    onPress={() => setShowAllFlavors(true)}
                  >
                    <Text style={styles.viewMoreText}>
                      View {hiddenFlavorCount} More
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Frequently bought together (checkboxes) */}
            {frequentlyBought.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>
                    Frequently bought together
                  </Text>
                  <Text style={styles.sectionHint}>(Optional)</Text>
                </View>

                {visibleTogether.map(x => {
                  const checked = selectedTogetherIds.has(x.id);
                  return (
                    <Pressable
                      key={x.id}
                      style={styles.optionRow}
                      onPress={() => toggleTogether(x.id)}
                    >
                      <Text style={styles.optionLabel}>{x.label}</Text>
                      <View style={styles.optionRight}>
                        {toNumber(x.price, 0) > 0 && (
                          <Text style={styles.optionPrice}>
                            + {currencySymbol}
                            {toNumber(x.price, 0)}
                          </Text>
                        )}
                        <View
                          style={[
                            styles.checkbox,
                            checked && styles.checkboxChecked,
                          ]}
                        >
                          {checked && (
                            <Text style={styles.checkboxTick}>✓</Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}

                {hiddenTogetherCount > 0 && (
                  <Pressable
                    style={styles.viewMoreBtn}
                    onPress={() => setShowAllTogether(true)}
                  >
                    <Text style={styles.viewMoreText}>
                      View {hiddenTogetherCount} More
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Notes */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Additional Request</Text>
                <Text style={styles.sectionHint}>(Optional)</Text>
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Request"
                  placeholderTextColor="#9AA0A6"
                  style={styles.input}
                  multiline
                  maxLength={160}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{notes.length}/160</Text>
              </View>
            </View>

            <View style={{ height: 140 + (Platform.OS === 'ios' ? 10 : 0) }} />
          </View>

          {/* Fixed bottom bar */}
          <View style={styles.bottomBar}>
            <View style={styles.bottomTopRow}>
              <View style={styles.qtyWrap}>
                <Pressable onPress={decQty} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <Text style={styles.qtyText}>{quantity}</Text>
                <Pressable onPress={incQty} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>＋</Text>
                </Pressable>
              </View>

              <View style={styles.totalWrap}>
                <Text style={styles.totalValue}>
                  {currencySymbol}
                  {totalPrice}
                </Text>
                <Text style={styles.totalLabel}>Total Price</Text>
              </View>
            </View>

            <Pressable 
              onPress={handleAdd} 
              style={[styles.addCartBtn, isSubmitting && styles.addCartBtnDisabled]}
              disabled={isSubmitting}
            >
              <Text style={styles.addCartText}>
                {isSubmitting ? 'Adding...' : 'Add to Cart'}
              </Text>
            </Pressable>
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
  closeFab: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 40,
    alignSelf: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  closeFabText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111',
    marginTop: -1,
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleWrap: {
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E6E6E6',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  heroCard: {
    marginTop: 2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  titleRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  foodDesc: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  heartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    fontSize: 16,
    color: '#111',
    marginTop: -1,
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#111',
    fontWeight: '800',
    marginTop: -1,
  },
  qtyText: {
    width: 28,
    textAlign: 'center',
    fontWeight: '800',
    color: '#111',
  },
  section: {
    marginTop: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 12,
    color: '#9AA0A6',
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#F3F3F3',
  },
  optionLabel: {
    flex: 1,
    color: '#222',
    fontSize: 13,
    fontWeight: '600',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionPrice: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#FF3D3D',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF3D3D',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    borderColor: '#FF3D3D',
    backgroundColor: '#FF3D3D',
  },
  checkboxTick: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  viewMoreBtn: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 16,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111111',
  },
  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    minHeight: 74,
    color: '#111',
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  charCount: {
    marginTop: 8,
    fontSize: 11,
    color: '#9AA0A6',
    textAlign: 'right',
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  bottomTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalWrap: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 18,
    color: '#111',
    fontWeight: '900',
  },
  addCartBtn: {
    marginTop: 12,
    backgroundColor: '#FF3D3D',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCartBtnDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  addCartText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
});
