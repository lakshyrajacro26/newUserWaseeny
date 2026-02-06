import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { useRef } from 'react';

import { ConflictModal } from '../components/ConflictModal';
import {
  buildCartLineId,
  calculateCartLineTotals,
  calculateCartTotals,
  toNumber,
} from '../services/cartPricing';
import {
  getCart,
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
} from '../services/cartService';

export const CartContext = createContext({});

function normalizeLegacyItemToCartLine(raw) {
  if (!raw) return null;

  // Legacy screens use: { ...menuItem, qty }
  const quantity = toNumber(raw.quantity ?? raw.qty ?? 1, 1);

  const basePrice = toNumber(raw.basePrice ?? raw.price ?? 0, 0);
  const selectedFlavor = raw.selectedFlavor ?? null;
  const addOns = raw.addOns ?? raw.frequentlyBoughtTogether ?? [];

  const menuItemId = raw.menuItemId ?? raw.itemId ?? raw.id;
  const restaurantId = raw.restaurantId ?? raw.restaurant?.id ?? null;

  const id =
    raw.cartLineId ||
    raw.id ||
    buildCartLineId({
      restaurantId,
      menuItemId,
      selectedFlavorId: selectedFlavor?.id ?? null,
      addOnIds: Array.isArray(addOns) ? addOns.map(a => a?.id) : [],
    });

  const { unitTotal, totalPrice } = calculateCartLineTotals({
    basePrice,
    selectedFlavor,
    addOns,
    quantity,
  });

  return {
    id,
    menuItemId,
    name: raw.name,
    image: raw.image,
    basePrice,
    price: basePrice,
    selectedFlavor,
    addOns,
    quantity,
    qty: quantity,
    unitTotal,
    totalPrice,

    restaurantId,
    restaurantName: raw.restaurantName ?? raw.restaurant?.name,
    restaurant: raw.restaurant,
  };
}

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth();
  const [cart, setCart] = useState([]);
  const [backendCart, setBackendCart] = useState(null);
  const [bill, setBill] = useState(null);
  const [orders, setOrders] = useState([]);
  const [checkout, setCheckout] = useState({
    type: 'delivery',
    date: null,
    time: null,
  });
  const [address, setAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  
  // Conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [pendingConflictPayload, setPendingConflictPayload] = useState(null);
  const [conflictModalLoading, setConflictModalLoading] = useState(false);

  // Debounce timers for quantity updates (prevent multiple API calls)
  const quantityUpdateTimers = useRef({});
  const pendingQuantities = useRef({});
  const cartRef = useRef([]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Fetch cart only when user is authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      console.log('CartContext: User authenticated, fetching cart');
      fetchCart();
    } else if (isInitialized && !isAuthenticated) {
      console.log('CartContext: User not authenticated, clearing cart');
      setCart([]);
      setBackendCart(null);
      setBill(null);
    }
  }, [isAuthenticated, isInitialized]);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      console.log('CartContext: Fetching cart...');
      const data = await getCart();
      console.log('CartContext: Cart data received:', data);
      
      if (data?.cart) {
        setBackendStatus('online');
        setBackendCart(data.cart);
        setBill(data.bill);
        // Transform backend cart items to local format
        const transformedItems = (data.cart.items || []).map(item => ({
          id: item._id,
          menuItemId: item.product,
          productId: item.product,
          name: item.name,
          image: item.restaurant?.image || '',
          basePrice: item.price,
          price: item.price,
          quantity: item.quantity,
          qty: item.quantity,
          selectedFlavor: item.variation || null,
          addOns: item.addOns || [],
          unitTotal: item.price,
          totalPrice: item.price * item.quantity,
          restaurantId: data.cart.restaurant?._id,
          restaurantName: data.cart.restaurant?.name?.en || 'Restaurant',
          restaurant: data.cart.restaurant,
        }));
        console.log('CartContext: Transformed items:', transformedItems);
        setCart(transformedItems);
      } else {
        console.log('CartContext: No cart data, clearing cart');
        setBackendStatus('online'); // No cart but backend responded
        setCart([]);
        setBackendCart(null);
        setBill(null);
      }
    } catch (error) {
      console.error('CartContext: Error fetching cart:', error?.message, error?.status);
      // Mark backend as offline if network error
      if (!error?.response) {
        setBackendStatus('offline');
      }
      if (error?.status === 401 || error?.status === 403) {
        console.log('CartContext: Authentication error while fetching cart');
      }
      // Clear cart on any error
      setCart([]);
      setBackendCart(null);
      setBill(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConflict = useCallback((conflictData, payload, onSuccess) => {
    const { currentRestaurant, newRestaurant } = conflictData;
    
    console.log('CartContext: Showing conflict modal for restaurants:', {
      current: currentRestaurant?.name,
      new: newRestaurant?.name,
    });
    
    // Store conflict data and pending payload
    setConflictData(conflictData);
    setPendingConflictPayload(payload);
    setShowConflictModal(true);
  }, [fetchCart]);

  const addToCart = useCallback(async (rawItem) => {
    try {
      setLoading(true);
      console.log('📦 CartContext: Adding item to cart:', rawItem);
      
      const restaurantId = rawItem.restaurantId || rawItem.restaurant?.id || rawItem.restaurant?._id;
      const productId = rawItem.menuItemId || rawItem.productId || rawItem.id;
      const quantity = rawItem.quantity || rawItem.qty || 1;
      const variationId = rawItem.selectedFlavor?.id || rawItem.selectedFlavor?._id || null;
      const addOnsIds = (rawItem.addOns || []).map(a => a?.id || a?._id).filter(Boolean);

      const payload = {
        restaurantId,
        productId,
        quantity,
        variationId: variationId || undefined,
        addOnsIds: addOnsIds.length > 0 ? addOnsIds : [],
      };

      console.log('📤 CartContext: Sending payload to API:', payload);
      const result = await addItemToCart(payload);
      console.log('📥 CartContext: API result received:', result);

      // CHECK FOR CONFLICT FIRST (before any other checks)
      if (result && result.conflict === true) {
        console.log('⚠️ CartContext: CONFLICT DETECTED IN RESULT!');
        console.log('  Current Restaurant:', result.currentRestaurant?.name);
        console.log('  New Restaurant:', result.newRestaurant?.name);
        
        setLoading(false);
        
        // Show modal with conflict data
        console.log('CartContext: Setting conflict modal state...');
        setConflictData({
          currentRestaurant: result.currentRestaurant,
          newRestaurant: result.newRestaurant,
        });
        setPendingConflictPayload(payload);
        setShowConflictModal(true);
        console.log('✅ CartContext: Modal should now be visible');
        
        return { conflict: true };
      }

      // Then check for successful addition
      if (result?.cart) {
        console.log('✅ CartContext: Item added successfully');
        setBackendCart(result.cart);
        setBill(result.bill);
        await fetchCart();
        return { success: true };
      }
      
      // If neither conflict nor cart data, something unexpected happened
      console.warn('⚠️ CartContext: Unexpected response format:', result);
      return { error: true };
    } catch (error) {
      console.error('❌ CartContext: Error adding to cart:', error?.message, error?.status);
      if (error?.status === 401 || error?.status === 403) {
        Alert.alert('Session Expired', 'Please log in again.');
      } else if (error?.message?.includes('Network')) {
        // Network error - don't show alert, just log
        console.warn('CartContext: Network error caught, not showing alert');
      } else {
        Alert.alert('Error', error?.message || 'Failed to add item to cart');
      }
      return { error: true };
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const removeFromCart = useCallback(async (id) => {
    try {
      setLoading(true);
      await removeItemFromCart(id);
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      Alert.alert('Error', 'Failed to remove item');
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      // Remove all items one by one or implement a clear cart API
      for (const item of cart) {
        await removeItemFromCart(item.id);
      }
      setCart([]);
      setBackendCart(null);
      setBill(null);
      setCheckout({ type: 'delivery', date: null, time: null });
      setAddress(null);
      setPaymentMethod(null);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const clearCheckoutFlow = useCallback(() => {
    setCheckout({ type: 'delivery', date: null, time: null });
    setAddress(null);
    setPaymentMethod(null);
  }, []);

  const addOrder = useCallback(order => {
    if (!order) return;
    setOrders(prev => [order, ...prev]);
  }, []);

  const getOrderById = useCallback(
    orderId => orders.find(o => o.id === orderId),
    [orders],
  );

  const setItemQuantity = useCallback(async (id, quantity) => {
    const item = cart.find(i => i.id === id);
    if (!item) {
      Alert.alert('Error', 'Item not found in cart');
      return;
    }

    try {
      setLoading(true);
      const result = await updateItemQuantity(id, {
        quantity: Math.max(1, Number(quantity)),
      });
      if (result?.cart) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', error?.message || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  }, [cart, fetchCart]);

  const incrementItem = useCallback((id) => {
    console.log('🔼 Increment - non-blocking');

    const matchId = String(id);
    const currentCart = Array.isArray(cartRef.current) ? cartRef.current : [];
    const item = currentCart.find(i =>
      String(i.id) === matchId ||
      String(i.menuItemId ?? i.productId ?? '') === matchId,
    );
    if (!item) return;

    const resolvedId = item.id;
    const newQty = toNumber(item.quantity, 1) + 1;
    const unitPrice = item.price || item.basePrice || 0;

    pendingQuantities.current[resolvedId] = newQty;

    // Optimistic update using functional state
    setCart(prevCart =>
      prevCart.map(it =>
        String(it.id) === String(resolvedId)
          ? { ...it, quantity: newQty, qty: newQty, totalPrice: unitPrice * newQty }
          : it
      )
    );

    // Debounce API call
    if (quantityUpdateTimers.current[resolvedId]) {
      clearTimeout(quantityUpdateTimers.current[resolvedId]);
    }

    quantityUpdateTimers.current[resolvedId] = setTimeout(async () => {
      try {
        console.log('📡 API sync increment');
        const finalQty = pendingQuantities.current[resolvedId];
        if (!Number.isFinite(finalQty)) return;
        const result = await updateItemQuantity(resolvedId, { quantity: finalQty });
        if (result?.cart) {
          const byId = new Map(
            (result.cart.items || []).map(it => [String(it._id), it]),
          );
          setCart(prev =>
            prev.map(it => {
              const backend = byId.get(String(it.id));
              if (!backend) return it;
              const qty = toNumber(backend.quantity, it.quantity);
              const price = it.price || it.basePrice || 0;
              return {
                ...it,
                quantity: qty,
                qty,
                totalPrice: price * qty,
              };
            }),
          );
          setBackendCart(result.cart);
          setBill(result.bill);
          console.log('✅ Synced');
        }
      } catch (err) {
        console.error('❌ Sync failed');
      }
    }, 350);
  }, []);

  const decrementItem = useCallback((id) => {
    console.log('🔽 Decrement - non-blocking');

    const matchId = String(id);
    const currentCart = Array.isArray(cartRef.current) ? cartRef.current : [];
    const item = currentCart.find(i =>
      String(i.id) === matchId ||
      String(i.menuItemId ?? i.productId ?? '') === matchId,
    );
    if (!item) return;

    const resolvedId = item.id;
    const currentQty = toNumber(item.quantity, 1);
    const unitPrice = item.price || item.basePrice || 0;

    if (currentQty <= 1) {
      if (quantityUpdateTimers.current[resolvedId]) {
        clearTimeout(quantityUpdateTimers.current[resolvedId]);
        delete quantityUpdateTimers.current[resolvedId];
      }
      delete pendingQuantities.current[resolvedId];
      setCart(prevCart =>
        prevCart.filter(it => String(it.id) !== String(resolvedId))
      );
      removeFromCart(resolvedId);
      return;
    }

    const newQty = currentQty - 1;
    pendingQuantities.current[resolvedId] = newQty;

    setCart(prevCart =>
      prevCart.map(it =>
        String(it.id) === String(resolvedId)
          ? { ...it, quantity: newQty, qty: newQty, totalPrice: unitPrice * newQty }
          : it
      )
    );

    // Debounce API call
    if (quantityUpdateTimers.current[resolvedId]) {
      clearTimeout(quantityUpdateTimers.current[resolvedId]);
    }

    quantityUpdateTimers.current[resolvedId] = setTimeout(async () => {
      try {
        console.log('📡 API sync decrement');
        const finalQty = pendingQuantities.current[resolvedId];
        if (!Number.isFinite(finalQty)) return;
        const result = await updateItemQuantity(resolvedId, { quantity: finalQty });
        if (result?.cart) {
          const byId = new Map(
            (result.cart.items || []).map(it => [String(it._id), it]),
          );
          setCart(prev =>
            prev.map(it => {
              const backend = byId.get(String(it.id));
              if (!backend) return it;
              const qty = toNumber(backend.quantity, it.quantity);
              const price = it.price || it.basePrice || 0;
              return {
                ...it,
                quantity: qty,
                qty,
                totalPrice: price * qty,
              };
            }),
          );
          setBackendCart(result.cart);
          setBill(result.bill);
          console.log('✅ Synced');
        }
      } catch (err) {
        console.error('❌ Sync failed');
      }
    }, 350);
  }, [removeFromCart]);

  // Conflict Modal Handlers
  const handlePlaceCurrentOrder = useCallback(() => {
    console.log('CartContext: User chose to place current order');
    setShowConflictModal(false);
    setConflictData(null);
    setPendingConflictPayload(null);
  }, []);

  const handleFreshCart = useCallback(async () => {
    try {
      setConflictModalLoading(true);
      console.log('CartContext: User chose fresh cart, clearing and adding new item');
      
      if (!pendingConflictPayload) {
        console.error('CartContext: No pending payload for fresh cart');
        return;
      }

      const result = await addItemToCart({ ...pendingConflictPayload, clearCart: true });
      
      console.log('CartContext: Fresh cart result:', result);
      if (result?.cart) {
        setBackendCart(result.cart);
        setBill(result.bill);
        
        // Close modal
        setShowConflictModal(false);
        setConflictData(null);
        setPendingConflictPayload(null);
        
        // Refresh cart
        await fetchCart();
      }
    } catch (error) {
      console.error('CartContext: Error in fresh cart:', error?.message);
      Alert.alert('Error', error?.message || 'Failed to add item');
    } finally {
      setConflictModalLoading(false);
    }
  }, [pendingConflictPayload, fetchCart]);

  const cartCount = useMemo(
    () => cart.reduce((s, it) => s + toNumber(it.quantity, 1), 0),
    [cart],
  );

  const totals = useMemo(() => {
    const localTotals = calculateCartTotals(cart);
    if (bill) {
      const subtotal = toNumber(localTotals.subtotal, 0);
      const discount = toNumber(bill.discount, 0);
      const tax = toNumber(bill.tax, 0);
      const delivery = toNumber(bill.deliveryFee, 0);
      const packaging = toNumber(bill.packaging, 0);
      const platformFee = toNumber(bill.platformFee, 0);
      const grandTotal = subtotal + delivery + tax + packaging + platformFee - discount;

      return {
        subtotal,
        discount,
        tax,
        delivery,
        packaging,
        platformFee,
        grandTotal,
      };
    }
    return localTotals;
  }, [cart, bill]);

  const cartState = useMemo(
    () => ({
      items: cart,
      address,
      paymentMethod,
      checkout,
      totals: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        delivery: totals.delivery,
        packaging: totals.packaging,
        platformFee: totals.platformFee,
        grandTotal: totals.grandTotal,
      },
      bill,
      backendCart,
    }),
    [address, cart, checkout, paymentMethod, totals, bill, backendCart],
  );

  return (
    <>
      <ConflictModal
        visible={showConflictModal}
        currentRestaurant={conflictData?.currentRestaurant}
        newRestaurant={conflictData?.newRestaurant}
        onPlaceOrder={handlePlaceCurrentOrder}
        onFreshCart={handleFreshCart}
        loading={conflictModalLoading}
      />
      <CartContext.Provider
        value={{
          cart,
          cartState,
          orders,
          cartCount,
          totals,
          bill,
          backendCart,
          loading,
          backendStatus,
          addToCart,
          addOrder,
          getOrderById,
          checkout,
          setCheckout,
          address,
          setAddress,
          paymentMethod,
          setPaymentMethod,
          clearCheckoutFlow,
          removeFromCart,
          clearCart,
          setItemQuantity,
          incrementItem,
          decrementItem,
          fetchCart,
        }}
      >
        {children}
      </CartContext.Provider>
    </>
  );
};

export default CartContext;
