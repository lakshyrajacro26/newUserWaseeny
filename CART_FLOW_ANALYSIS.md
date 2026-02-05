# Cart Flow Complete Analysis & Debug Implementation

## Issue Summary

**Error**: "Network Error" when fetching cart from API (`/api/cart`)
- **Source**: `CartContext.jsx:120` during `fetchCart()` call
- **Root Cause**: Network connectivity or authentication failure
- **Impact**: Cart cannot be fetched on app startup, blocking cart operations

## Complete Add-to-Cart Flow

### 1. **User Interaction Layer** (RestaurantDetail.jsx)
```
User clicks "+1" button on menu item
    ↓
quickAdd(item) is called
    ↓
addToCart(rawItem) → CartContext
```

**Key Variables at this stage:**
- `restaurantId`: From route params
- `menuItemId`: item.id
- `quantity`: 1
- `selectedFlavor`: null (unless variant selected)
- `addOns`: [] (unless add-ons selected)

---

### 2. **Context Processing** (CartContext.jsx → addToCart)

```
addToCart(rawItem)
    ↓
Extract data from rawItem:
    - restaurantId
    - productId (from menuItemId)
    - quantity
    - variationId
    - addOnsIds
    ↓
Build payload object:
{
  restaurantId: string,
  productId: string,
  quantity: number,
  variationId?: string,
  addOnsIds: string[]
}
    ↓
Call addItemToCart(payload)
```

**Expected payload structure:**
```javascript
{
  restaurantId: "60d5ec49f1b2c72c9c8e1a1b",
  productId: "60d5ec49f1b2c72c9c8e2a2b",
  quantity: 1,
  variationId: undefined,
  addOnsIds: []
}
```

---

### 3. **Service Layer** (cartService.js → addItemToCart)

```
addItemToCart(payload)
    ↓
POST to CART_ROUTES.addItem (/api/cart/item)
    ↓
Three possible responses:
    A) 200 OK: { cart, bill }
    B) 409 CONFLICT: { conflict: true, currentRestaurant, newRestaurant, actions }
    C) Error: Network error or 401/403 auth error
```

**Error Handling Path:**
- **409 Conflict**: Returned as object with conflict flag (not thrown)
- **404**: Item not found
- **401/403**: Authentication failed
- **Network Error**: Unresolvable connection issue

---

### 4. **API Communication** (apiClient.js)

```
POST /api/cart/item
Headers: {
  Authorization: "Bearer {token}",
  Content-Type: "application/json"
}
Body: payload
    ↓
Response Interceptor:
    - Success (2xx): Return response.data
    - Error: Extract message and throw Error
    ↓
Log detailed error info:
    - status code
    - URL
    - method
    - request body (config)
    - response data
    - is network error
```

**Authentication Flow:**
1. Token stored in AsyncStorage (key: "auth_token")
2. Request interceptor reads token and adds to headers
3. Response interceptor checks for 401/403 and indicates auth failure

---

### 5. **Response Handling** (CartContext.jsx)

```
If result.conflict:
    → Show Alert with "Fresh Cart" and "Place Current Order" buttons
    → If "Fresh Cart": Re-add with clearCart: true flag
    → If "Place Current Order": Cancel operation

If result.cart:
    → Update BackendCart state
    → Update Bill state
    → Transform items (backend _id → frontend id)
    → Fetch full cart again
    → Return { success: true }

If error:
    → Check error status
    → If 401/403: "Session Expired" alert
    → Else: Generic error alert
    → Return { error: true }
```

---

## Detailed Debug Logging Added

### Level 1: API Client (apiClient.js)
```javascript
// Logs all HTTP errors with detailed information
console.error('API Error Details:', {
  status: error?.response?.status,
  url: error?.config?.url,
  method: error?.config?.method,
  message: error?.message,
  responseData: error?.response?.data,
  isNetworkError: !error?.response
})
```

**What this tells you:**
- If `isNetworkError: true` → Connection issue (offline, DNS fail, server down)
- If `status: 401` → Token missing or invalid
- If `status: 403` → Token valid but insufficient permissions
- If `status: 404` → Endpoint doesn't exist
- If `responseData` → Backend returned error details

---

### Level 2: Cart Service (cartService.js)

**getCart():**
```javascript
// START
console.log('Fetching cart from:', CART_ROUTES.getCart)
// SUCCESS
console.log('Cart fetched successfully:', response.data)
// EMPTY (404)
console.log('Cart not found (404), returning empty cart')
// ERROR
console.error('Cart fetch failed:', error?.message, error?.response?.status)
```

**addItemToCart():**
```javascript
// REQUEST
console.log('Adding to cart:', { endpoint, payload })
// SUCCESS
console.log('Item added successfully:', response.data)
// CONFLICT
console.log('Conflict detected:', error.response.data)
// ERROR
console.error('Add to cart failed:', error?.message, error?.response?.status)
```

**updateItemQuantity():**
```javascript
// REQUEST
console.log('Updating item quantity:', { endpoint, itemId, payload })
// SUCCESS
console.log('Item quantity updated:', response.data)
// ERROR
console.error('Update quantity failed:', error?.message, error?.response?.status, 'for itemId:', itemId)
```

---

### Level 3: Cart Context (CartContext.jsx)

**fetchCart():**
```javascript
console.log('CartContext: Fetching cart...')
console.log('CartContext: Cart data received:', data)
console.log('CartContext: Transformed items:', transformedItems)
console.log('CartContext: No cart data, clearing cart')
console.error('CartContext: Error fetching cart:', error?.message, error?.status)
```

**addToCart():**
```javascript
console.log('CartContext: Adding item to cart:', rawItem)
console.log('CartContext: Payload for API:', payload)
console.log('CartContext: Add to cart result:', result)
console.log('CartContext: Conflict detected, showing dialog')
console.log('CartContext: Item added successfully')
console.error('CartContext: Error adding to cart:', error?.message, error?.status)
```

**incrementItem() / decrementItem():**
```javascript
console.log('CartContext: Incrementing item:', id)
console.log('CartContext: Current item:', item)
console.log('CartContext: Increment result:', result)
console.error('CartContext: Error incrementing item:', error?.message, error?.status)
console.error('CartContext: Item not found:', id)
```

---

## Network Error Diagnosis Guide

### When you see: "Network Error"

Check these in order:

1. **Is the backend running?**
   - Base URL: `https://foodpanda-den9.onrender.com`
   - Check if Render service is active
   - Try direct URL in browser

2. **Is the user authenticated?**
   - User should have valid token in AsyncStorage
   - Token stored with key: `auth_token`
   - Check AuthContext: `isAuthenticated`, `token`

3. **Check network logs:**
   ```
   API Error Details: {
     status: undefined,     ← Network error (no response)
     isNetworkError: true   ← Confirms network issue
   }
   ```

4. **Check request details:**
   - Endpoint: `/api/cart`
   - Method: `GET`
   - Headers should include: `Authorization: Bearer {token}`

5. **Check response format:**
   - Backend must return: `{ cart: { ... }, bill: { ... } }`
   - Or empty cart: `{ cart: null, bill: null }`

---

## Item ID Format Mapping

### Backend → Frontend
```javascript
// Backend response item
{
  _id: "507f1f77bcf86cd799439011",
  product: "507f1f77bcf86cd799439012",
  name: "Burger",
  price: 250,
  quantity: 2,
  variation: null,
  addOns: [],
  restaurant: { ... }
}

// Frontend transformed item
{
  id: "507f1f77bcf86cd799439011",        // ← _id becomes id
  menuItemId: "507f1f77bcf86cd799439012", // ← product becomes menuItemId
  productId: "507f1f77bcf86cd799439012",
  name: "Burger",
  price: 250,
  quantity: 2,
  selectedFlavor: null,
  addOns: [],
  restaurantId: "...",
  restaurant: { ... }
}
```

**Key Operations:**
- `incrementItem(id)` → uses backend `_id`
- `decrementItem(id)` → uses backend `_id`
- `removeFromCart(id)` → uses backend `_id`

---

## Common Issues & Solutions

### Issue 1: "Item not found in cart"
- **Cause**: Quantity button using wrong ID format
- **Solution**: Use `getCartLineIdForItem()` to get correct backend ID
- **Code**: `RestaurantDetail.jsx:476` uses correct ID extraction

### Issue 2: Empty Image URIs
- **Cause**: Backend not returning image field
- **Solution**: Added fallback to default image
- **Code**: `Cart.jsx:151` checks for empty string

### Issue 3: Conflict popup not showing
- **Cause**: addItemToCart returning error instead of conflict object
- **Solution**: Check if `result.conflict` is true before showing dialog
- **Code**: `CartContext.jsx:182` checks conflict flag

### Issue 4: "Network Error" on app startup
- **Cause**: Either backend offline or user not authenticated
- **Solutions**:
  1. Check backend is running
  2. User must log in first
  3. Token must be valid
  4. Check network connectivity

---

## Testing Checklist

Use these console logs to debug:

### Test 1: Fetch Cart
```javascript
// Look for:
// ✓ CartContext: Fetching cart...
// ✓ Fetching cart from: /api/cart
// ✓ Cart fetched successfully: { cart: {...}, bill: {...} }
```

### Test 2: Add Item
```javascript
// Look for:
// ✓ CartContext: Adding item to cart: {...}
// ✓ CartContext: Payload for API: {...}
// ✓ Adding to cart: { endpoint: /api/cart/item, payload: {...} }
// ✓ Item added successfully: {...}
```

### Test 3: Increment Item
```javascript
// Look for:
// ✓ CartContext: Incrementing item: {id}
// ✓ Updating item quantity: { endpoint: /api/cart/item/{id}/quantity, payload: {action: increase} }
// ✓ Item quantity updated: {...}
```

### Test 4: Detect Conflict
```javascript
// Look for:
// ✓ Conflict detected: { currentRestaurant: {...}, newRestaurant: {...} }
// ✓ CartContext: Conflict detected, showing dialog
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose | Error Codes |
|----------|--------|---------|------------|
| `/api/cart` | GET | Fetch current cart | 401, 403, 500 |
| `/api/cart/item` | POST | Add item to cart | 409 (conflict), 401, 403, 500 |
| `/api/cart/item/{id}` | DELETE | Remove item | 404, 401, 403, 500 |
| `/api/cart/item/{id}/quantity` | POST | Update qty | 404, 400, 401, 403, 500 |

---

## Next Steps for Debugging

1. **Check logs in console.log output** for the flow of execution
2. **Verify token is present** in AsyncStorage before cart operations
3. **Verify backend is running** and accessible from your device
4. **Check network tab** in React Native debugger for actual HTTP requests/responses
5. **Verify payload format** matches what backend expects
6. **Test each operation independently**: add, increment, decrement, remove

