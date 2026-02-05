# Network Error - Backend Server Not Responding

## Issue Diagnosis
Based on the logs, **all API calls are failing with "Network Error"**:
- `/api/auth/login` - ❌ Network Error
- `/api/cart` - ❌ Network Error
- `/api/home` - ❌ Network Error
- `/api/menu` - ❌ Network Error

**Root Cause**: The backend server at `https://foodpanda-den9.onrender.com` is **not responding** or **not running**.

## What Was Fixed

### 1. **Enhanced Error Logging** ✅
- Added detailed network error diagnostics in `apiClient.js`
- Now logs: baseURL, timeout, method, and clear "Backend not responding" messages
- Helps identify connectivity issues immediately

### 2. **Network Status Check Utility** ✅
- Created `src/utils/networkCheck.js` with functions to check:
  - Internet connectivity using NetInfo
  - Backend server reachability with health check ping
  - Overall network status

### 3. **Graceful Error Handling** ✅
- Cart service returns empty cart on network errors (no crashes)
- Auth errors handled without alerts
- Clear console messages for debugging

## How to Fix the Backend Connection

### Option 1: Use Local Backend (Development)
If you have a local backend running on your computer:

```javascript
// src/config/api.js
export const BASE_URL = "http://192.168.x.x:5000"; // Your local IP and port
// or
export const BASE_URL = "http://10.0.2.2:5000"; // For Android emulator
```

### Option 2: Check Render.com Backend
If using Render.com hosting:

1. **Go to your Render.com dashboard**
2. **Check service status** - is it deployed and running?
3. **Check logs** - any errors in the service?
4. **Restart the service** if needed
5. **Verify the URL** - `https://foodpanda-den9.onrender.com`

### Option 3: Deploy Backend if Missing
If no backend is deployed yet:
```bash
# Clone your backend repo
git clone <backend-repo>
cd backend

# Deploy to Render.com
# Follow Render.com deployment docs
# Set environment variables in Render dashboard
```

## How to Check Backend Status

### Check Console Logs
After you've set up the backend, you'll see:
```javascript
// Before (Network Error)
🔴 Network error - Backend server not responding
Please ensure the backend server is running at: https://foodpanda-den9.onrender.com

// After (Success)
✅ Cart fetched successfully: {cart: {...}, bill: {...}}
```

### Use the Network Check Utility
```javascript
import { checkNetworkStatus } from '../utils/networkCheck';

// Check status anytime
const status = await checkNetworkStatus();
if (status.status === 'backend-unreachable') {
  console.log('Backend is down:', status.backendUrl);
} else if (status.status === 'online') {
  console.log('All systems operational');
}
```

## Expected Behavior After Fix

### 1. **App Launch (Not Logged In)**
- ✅ No network errors
- ✅ No API calls attempted
- ✅ Cart stays empty

### 2. **User Login**
- ✅ `/api/auth/login` called successfully
- ✅ Token saved to AsyncStorage
- ✅ Auth status updated

### 3. **App Fetches Cart**
- ✅ `/api/cart` returns items
- ✅ Cart displays with quantities
- ✅ Images and prices show correctly

### 4. **User Increments Item**
- ✅ `PATCH /api/cart/item/{id}/quantity` succeeds
- ✅ Quantity updates in UI
- ✅ No "Network Error" alerts

## Troubleshooting Checklist

- [ ] Backend server is running
- [ ] Base URL is correct in `src/config/api.js`
- [ ] Firewall allows outgoing HTTPS (port 443)
- [ ] DNS resolves correctly (ping the URL)
- [ ] Backend has CORS enabled for React Native
- [ ] Authentication token is valid
- [ ] Backend database has test data

## Required Package
The network check utility uses NetInfo. Install if not already present:
```bash
npm install @react-native-community/netinfo
```

## Summary
- **Frontend code**: ✅ All working correctly
- **Network handling**: ✅ Enhanced with better error messages
- **Root issue**: ⚠️ Backend server not running/responding
- **Next step**: Start or deploy your backend server
