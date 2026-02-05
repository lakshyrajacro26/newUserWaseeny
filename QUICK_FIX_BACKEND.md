# Quick Fix: Backend Not Responding

## The Problem
All API calls failing with "Network Error" - backend at `https://foodpanda-den9.onrender.com` is not responding.

## Quick Diagnosis (2 minutes)

### Check 1: Is Backend Service Running?
Go to: https://dashboard.render.com

Look for your service. Status should be:
- 🟢 **Running** = Good, but check logs
- 🟡 **Deploying** = Wait for deployment
- 🔴 **Failed** = Service crashed
- ⚠️ **Not found** = Service doesn't exist

### Check 2: Service Logs
Click your service → **Logs** tab

Look for:
- ❌ `Error: Cannot connect to database` → MongoDB issue
- ❌ `Error: Port already in use` → Port conflict
- ❌ `Error: Cannot find module` → Missing dependency
- ❌ Any exception/crash → Fix the error

### Check 3: Environment Variables
Click service → **Environment** tab

Must have:
- `PORT` (usually 5000)
- `MONGODB_URI` (database connection)
- `JWT_SECRET` (authentication)

If missing, add them and redeploy.

## Quick Fixes (Try These)

### Fix 1: Restart Service (30 seconds)
1. Go to Render dashboard
2. Click your service
3. Click "Manual Deploy"
4. Wait 2-3 minutes
5. Test in browser: `https://foodpanda-den9.onrender.com/api/health`

### Fix 2: Use Local Backend (5 minutes)
If you have backend running locally:

```javascript
// src/config/api.js
// Change from:
export const BASE_URL = "https://foodpanda-den9.onrender.com";

// To:
export const BASE_URL = "http://192.168.x.x:5000"; // Your local IP:port
// Or for Android emulator:
export const BASE_URL = "http://10.0.2.2:5000";
```

Then start local backend:
```bash
cd backend
npm start
```

### Fix 3: Redeploy Backend (10 minutes)
If using Render.com:

1. Go to Render dashboard
2. Click your service
3. Go to **Settings** → **Redeploy**
4. Click "Redeploy latest commit"
5. Check logs for any errors
6. Wait for "Build successful"

## Verify Fix Works

Once backend is running, you should see:
```
✅ cartService.js:11 Cart fetched successfully: {cart: {...}}
✅ HomePage.jsx:258 API response received in XXXX ms
✅ No more Network Error messages
```

## Which Fix to Use?

- **In Development?** → Use **Fix 2** (local backend)
- **Backend deployed to Render?** → Use **Fix 1** or **Fix 3**
- **Not sure?** → Check if backend code exists and run locally

## Need Backend Code?

If you don't have backend running at all, you need to:
1. Clone/create backend repository
2. Install dependencies: `npm install`
3. Set up MongoDB connection
4. Run locally: `npm start`
5. Test: `curl http://localhost:5000/api/health`

## Test Endpoints

Once backend is working, test these in browser:

```
http://localhost:5000/api/health          (should return JSON)
http://localhost:5000/api/cart            (needs auth token)
http://localhost:5000/api/home            (should return restaurants)
```

## Status After Fix

**Before:**
```
🔴 Network error - Backend server not responding at https://foodpanda-den9.onrender.com
CartContext: No cart data, clearing cart
```

**After:**
```
✅ CartContext: Cart data received: {cart: {items: [...]}, bill: {...}}
✅ CartContext: Transformed items: (2) [{...}, {...}]
✅ HomePage: API response received in 3000ms
```

## Still Not Working?

1. Check backend logs for specific error message
2. Verify MongoDB is running and accessible
3. Verify all environment variables are set
4. Check if backend port matches in code (5000 by default)
5. Try restarting everything

## Checklist

Before testing, verify:
- [ ] Backend service is running (Render or local)
- [ ] Backend URL is correct in `src/config/api.js`
- [ ] Environment variables are set (if Render)
- [ ] MongoDB is accessible
- [ ] Can reach backend in browser (`curl` or browser tab)

Once these are ✅, app will work perfectly!
