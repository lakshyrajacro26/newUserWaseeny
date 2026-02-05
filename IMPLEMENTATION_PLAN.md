# Implementation Plan: UI Optimization & Debouncing

## Overview
This plan addresses three main issues:
1. **Restaurant Detail Page**: Plus button should open AddToCartDrawer instead of calling API directly
2. **AddToCartDrawer**: Should call API with debouncing when user clicks "Add to Cart" button
3. **Cart Page**: Increment/Decrement buttons should update UI optimistically with debounced API calls

---

## Current Issues Analysis

### Issue 1: Restaurant Detail - Plus Button Behavior
**Current Flow:**
- Plus button → `quickAdd()` function → Direct API call → Re-render with delay

**Problem:**
- No drawer to customize item (flavors, add-ons)
- Instant API call causes UI lag
- User can't modify item before adding

**Required Flow:**
- Plus button → Open AddToCartDrawer → User customizes item → Click "Add" button → Debounced API call

---

### Issue 2: AddToCartDrawer - No API Call
**Current Flow:**
- Drawer open with item customization options
- `handleAdd()` exists but doesn't properly debounce API calls
- No feedback during API processing

**Problem:**
- Need debouncing to prevent multiple rapid clicks
- Need loading state feedback
- Need error handling with retry

**Solution:**
- Implement debounced API call in `handleAdd()`
- Add loading state during submission
- Show success/error toast

---

### Issue 3: Cart Page - Increment/Decrement
**Current Flow:**
- Click ± button → API call → Wait for response → Re-render
- Slow and non-responsive UI

**Problem:**
- API calls on every single click
- No optimistic UI updates
- No debouncing on rapid clicks

**Solution:**
- Update UI immediately (optimistic)
- Debounce API call (300-500ms)
- Call API in background
- Rollback on error with toast notification

---

## Implementation Plan

### Phase 1: Create Debouncing Utilities ✓
**File:** `src/utils/debounce.js`

Features:
- `useDebounce()` hook for debouncing state changes
- `debounceAsync()` function for async operations
- Automatic cleanup on unmount

---

### Phase 2: Update RestaurantDetail.jsx
**Changes:**
1. Replace `quickAdd()` direct API call with drawer open function
2. Keep the Plus button but make it show "Add" text instead of icon
3. When user clicks "Add", open AddToCartDrawer
4. Store selected item in state for drawer
5. Handle drawer submission with proper flow

**Code Changes:**
- Remove async from `quickAdd()` 
- Make it open drawer instead: `setSelectedItem(item); setDrawerVisible(true);`
- Create `handleDrawerClose()` and `handleDrawerSubmit()`

---

### Phase 3: Update AddToCartDrawer.jsx
**Changes:**
1. Implement debounced `handleAdd()` using debouncing utility
2. Add loading state during submission
3. Add error handling with user-friendly messages
4. Prevent multiple submissions while API is pending

**Code Changes:**
```javascript
const [isSubmitting, setIsSubmitting] = useState(false);
const debouncedAdd = useMemo(() => {
  return debounceAsync(async () => {
    setIsSubmitting(true);
    try {
      const result = await addToCart(cartItem);
      if (result?.conflict) return;
      onAddToCart?.();
      requestClose();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  }, 500);
}, [addToCart, cartItem]);

// In button:
onPress={() => !isSubmitting && debouncedAdd()}
disabled={isSubmitting}
```

---

### Phase 4: Update CartContext.jsx
**Changes:**
1. Implement optimistic UI updates for `incrementItem()` and `decrementItem()`
2. Add debouncing to reduce API calls
3. Improve error handling with rollback

**Code Changes:**
```javascript
const incrementItem = useCallback(async (id) => {
  // Step 1: Optimistic update
  setCart(prev => prev.map(item => 
    item.id === id 
      ? { ...item, quantity: item.quantity + 1 }
      : item
  ));
  
  // Step 2: Debounced API call
  debouncedIncrement(id);
}, []);

const debouncedIncrement = useMemo(() => {
  return debounceAsync(async (id) => {
    try {
      const result = await updateItemQuantity(id, { action: 'increase' });
      if (result?.cart) {
        setBackendCart(result.cart);
      }
    } catch (error) {
      // Rollback on error
      setCart(prev => prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      ));
      Alert.alert('Error', 'Failed to update quantity');
    }
  }, 300);
}, []);
```

---

### Phase 5: Update Cart.jsx
**Changes:**
1. Ensure increment/decrement buttons use proper IDs
2. Add visual feedback during updates
3. Ensure proper handling of cartLineId vs id

---

## Debouncing Strategy

### Why Debouncing?
- Prevents rapid duplicate API calls
- Reduces server load
- Improves UX responsiveness
- Allows time for optimistic UI updates

### Debounce Timings:
- AddToCartDrawer submit: 500ms (user might click multiple times)
- Cart increment/decrement: 300ms (rapid clicks should batch)
- RestaurantDetail quickAdd: 500ms (if kept with drawer)

### Debouncing Implementation:
```javascript
// In utils/debounce.js
export const debounceAsync = (fn, delay) => {
  let timeoutId;
  let isExecuting = false;
  
  const debounced = async (...args) => {
    clearTimeout(timeoutId);
    
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          isExecuting = true;
          const result = await fn(...args);
          isExecuting = false;
          resolve(result);
        } catch (error) {
          isExecuting = false;
          reject(error);
        }
      }, delay);
    });
  };
  
  debounced.cancel = () => {
    clearTimeout(timeoutId);
    isExecuting = false;
  };
  
  return debounced;
};
```

---

## Error Handling Strategy

### AddToCartDrawer:
- Show toast on API error
- Allow user to retry
- Disable button during submission

### Cart Page:
- Rollback optimistic update on error
- Show toast with error message
- Don't disable buttons (user can retry)

### Conflict Handling:
- Show conflict modal as before
- Don't interfere with debouncing

---

## Testing Checklist
- [ ] Click plus button on restaurant detail → Opens drawer
- [ ] Customize item in drawer → Add to cart → Shows loading → Closes drawer
- [ ] Rapid clicks on "Add" button → Debounced (only one API call)
- [ ] Increment/Decrement in cart → UI updates instantly
- [ ] Network error on increment → Shows toast & rolls back quantity
- [ ] No network → Debounce still triggers API call after connection returns

---

## Files to Modify
1. `src/utils/debounce.js` - CREATE (new utility)
2. `src/screens/Orders/RestaurantDetail.jsx` - MODIFY
3. `src/components/AddToCartDrawer.jsx` - MODIFY
4. `src/context/CartContext.jsx` - MODIFY
5. `src/screens/Cart.jsx` - VERIFY/MINOR UPDATES

---

## Dependencies
- React hooks (useState, useCallback, useMemo, useEffect)
- React Native (Alert for error notifications)
- Existing cartService, updateItemQuantity functions

---

## Rollback Plan
Each change is isolated and can be reverted:
- Revert RestaurantDetail if drawer issue
- Revert AddToCartDrawer debouncing if conflicts
- Revert CartContext optimistic updates if data inconsistencies
