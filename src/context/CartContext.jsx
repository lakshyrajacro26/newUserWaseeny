import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
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
  
  // Track pending quantity update requests to prevent duplicates
  const pendingRequests = React.useRef({});

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

  const incrementItem = useCallback(async (id) => {
    console.log('CartContext: Incrementing item:', id);
    
    // Prevent duplicate requests for same item
    if (pendingRequests.current[id]) {
      console.log('CartContext: Request already pending for item:', id);
      return;
    }
    
    const item = cart.find(i => i.id === id);
    if (!item) {
      console.error('CartContext: Item not found:', id);
      Alert.alert('Error', 'Item not found in cart');
      return;
    }

    pendingRequests.current[id] = true;
    let retries = 0;
    const maxRetries = 2;
    
    try {
      setLoading(true);
      console.log('CartContext: Current item:', item);
      
      let result;
      while (retries < maxRetries) {
        try {
          result = await updateItemQuantity(id, { action: 'increase' });
          break;
        } catch (error) {
          retries++;
          if (retries < maxRetries && !error?.response) {
            // Network error, retry
            console.log(`CartContext: Retrying increment (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          } else {
            throw error;
          }
        }
      }
      
      console.log('CartContext: Increment result:', result);
      if (result?.cart) {
        await fetchCart();
      }
    } catch (error) {
      console.error('CartContext: Error incrementing item:', error?.message, error?.status);
      Alert.alert('Error', error?.message || 'Failed to increase quantity');
    } finally {
      setLoading(false);
      delete pendingRequests.current[id];
    }
  }, [cart, fetchCart]);

  const decrementItem = useCallback(async (id) => {
    console.log('CartContext: Decrementing item:', id);
    
    // Prevent duplicate requests for same item
    if (pendingRequests.current[id]) {
      console.log('CartContext: Request already pending for item:', id);
      return;
    }
    
    const item = cart.find(i => i.id === id);
    if (!item) {
      console.error('CartContext: Item not found:', id);
      Alert.alert('Error', 'Item not found in cart');
      return;
    }

    if (item.quantity <= 1) {
      console.log('CartContext: Item qty is 1, removing instead');
      await removeFromCart(id);
      return;
    }

    pendingRequests.current[id] = true;
    let retries = 0;
    const maxRetries = 2;
    
    try {
      setLoading(true);
      console.log('CartContext: Current item quantity:', item.quantity);
      
      let result;
      while (retries < maxRetries) {
        try {
          result = await updateItemQuantity(id, { action: 'decrease' });
          break;
        } catch (error) {
          retries++;
          if (retries < maxRetries && !error?.response) {
            // Network error, retry
            console.log(`CartContext: Retrying decrement (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          } else {
            throw error;
          }
        }
      }
      
      console.log('CartContext: Decrement result:', result);
      if (result?.cart) {
        await fetchCart();
      }
    } catch (error) {
      console.error('CartContext: Error decrementing item:', error?.message, error?.status);
      Alert.alert('Error', error?.message || 'Failed to decrease quantity');
    } finally {
      setLoading(false);
      delete pendingRequests.current[id];
    }
  }, [cart, fetchCart, removeFromCart]);

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
    if (bill) {
      return {
        subtotal: bill.itemTotal || 0,
        discount: bill.discount || 0,
        tax: bill.tax || 0,
        delivery: bill.deliveryFee || 0,
        packaging: bill.packaging || 0,
        platformFee: bill.platformFee || 0,
        grandTotal: bill.toPay || 0,
      };
    }
    return calculateCartTotals(cart);
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
