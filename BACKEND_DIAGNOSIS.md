# Backend Connection Diagnosis Guide

## Current Issue
**Backend server at `https://foodpanda-den9.onrender.com` is NOT responding**

All API calls are timing out:
- GET `/api/cart` ❌ Network Error
- GET `/api/home` ❌ Network Error  
- POST `/api/auth/login` ❌ Network Error

## Root Cause Analysis

### Check 1: Is Backend Running?
```bash
# Test the backend URL directly
curl -I https://foodpanda-den9.onrender.com/api/health

# Expected response: 200 or 400/401 (any response means server is up)
# Actual response: Connection timeout or refused (server is down)
```

### Check 2: Render.com Service Status
1. Go to: https://dashboard.render.com
2. Find your service: `foodpanda-den9`
3. Check **Status**:
   - 🟢 Running = Server is up but may have issues
   - 🟡 Deploying = Server is updating
   - 🔴 Failed = Server crashed or failed to start

### Check 3: Check Service Logs
1. Click your service
2. Go to **Logs** tab
3. Look for:
   - ❌ Error messages
   - ❌ Port binding issues
   - ❌ Database connection failures
   - ❌ Missing environment variables

### Check 4: Environment Variables
1. Go to **Environment** tab in Render dashboard
2. Verify these exist:
   - `PORT` = 5000 (or configured port)
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = Your JWT secret
   - Any other required env vars

### Check 5: MongoDB Connection
If logs show "Cannot connect to MongoDB":
1. Verify MongoDB Atlas cluster is running
2. Check MongoDB user credentials
3. Verify IP whitelist includes Render.com IPs
4. Test connection string manually

## Solution Steps

### Option A: Local Backend (Development)
```javascript
// src/config/api.js
export const BASE_URL = "http://localhost:5000"; // or your local IP
```

Then start local backend:
```bash
cd backend
npm install
npm start
```

### Option B: Fix Render.com Deployment
1. **Check logs**: Are there deployment errors?
2. **Redeploy**: Click "Manual Deploy" in Render dashboard
3. **Check health**: Run `curl https://foodpanda-den9.onrender.com/api/health`
4. **Verify port**: Ensure backend listens on correct port

### Option C: Check Network/Firewall
```bash
# Test DNS resolution
nslookup foodpanda-den9.onrender.com

# Test connectivity (on Windows)
Test-NetConnection foodpanda-den9.onrender.com -Port 443
```

## Quick Fixes to Try

### 1. Restart Render Service
- Go to Render dashboard
- Click your service
- Click "Manual Deploy"
- Wait for deployment to complete

### 2. Check for Crashes
- View recent logs in Render
- Look for any exceptions or errors
- Check if service crashed immediately after starting

### 3. Verify Environment Variables
- Missing `PORT` variable?
- Missing database connection string?
- Wrong credentials in env vars?

### 4. Test Directly
Open in browser/curl:
```
https://foodpanda-den9.onrender.com/api/health
```

Should return something like:
```json
{"status":"ok"}
```

## Expected Behavior After Fix

### Console Logs (Success)
```
✅ Cart fetched successfully: {cart: {...}}
✅ API response received in 3000ms
✅ Item added successfully
```

### Console Logs (Current - Failure)
```
🔴 Network error - Backend server not responding
Network Error: Backend server not responding at https://foodpanda-den9.onrender.com
```

## Verify Backend is Working

### Method 1: Browser Test
Open in browser:
```
https://foodpanda-den9.onrender.com/api/health
```

Should show response (not "cannot reach")

### Method 2: API Test Tool
Use Postman or Insomnia:
```
GET https://foodpanda-den9.onrender.com/api/health
```

### Method 3: Frontend Console
When backend is working, you'll see:
```
cartService.js:11 Cart fetched successfully: {...}
```

## Checklist

- [ ] Render.com service shows "Running" status
- [ ] Service logs show no errors
- [ ] MongoDB connection successful in logs
- [ ] Can reach `https://foodpanda-den9.onrender.com/api/health` in browser
- [ ] All environment variables are set
- [ ] Backend is listening on correct port

## Important Note

**The frontend code is working correctly.** The issue is purely that the backend server is not responding. Once you fix the backend, all cart operations will work immediately.

## Need More Help?

Check Render.com documentation:
- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/troubleshooting

Check your backend logs for specific error messages - those will tell you exactly what's wrong.
