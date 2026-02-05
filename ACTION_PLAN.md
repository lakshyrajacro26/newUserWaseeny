# Action Plan: Get Cart Working

## Current State
✅ **Frontend cart code is 100% correct**
❌ **Backend server is not running**

## What To Do RIGHT NOW

### Step 1: Check if Backend Exists
```bash
# Do you have a backend folder?
ls -la backend/

# Is there a backend repository?
# Look for:
# - backend/
# - server/
# - api/
# - foodpanda-backend/
```

### Step 2: If Backend Exists Locally
```bash
# Go to backend
cd backend

# Install dependencies
npm install

# Start server
npm start

# Should show: "Server running on port 5000" or similar
```

### Step 3: Update Frontend to Use Local Backend
```javascript
// src/config/api.js
// CHANGE THIS:
export const BASE_URL = "https://foodpanda-den9.onrender.com";

// TO THIS:
export const BASE_URL = "http://localhost:5000";
```

### Step 4: Test Backend Directly
```bash
# In browser or terminal
curl http://localhost:5000/api/health

# Should return: {"status":"ok"} or similar response
# (Any response = backend is working)
```

### Step 5: Reload Frontend App
- Save changes
- App will hot-reload
- Should see in logs: `✅ Cart fetched successfully`

## If Backend Doesn't Exist

### Option A: Use Fake Data (Quick Demo)
Create mock cart data:
```javascript
// src/services/cartService.js - Add at top
const USE_MOCK_DATA = true; // Change to false when backend ready

export const getCart = async () => {
  if (USE_MOCK_DATA) {
    return {
      cart: {
        items: [
          {
            _id: '1',
            product: 'pizza-1',
            name: 'Margherita Pizza',
            price: 299,
            quantity: 1,
            restaurant: { _id: 'rest-1', name: 'My Restaurant' }
          }
        ],
        restaurant: { _id: 'rest-1', name: 'My Restaurant' }
      },
      bill: { subtotal: 299, toPay: 299 }
    };
  }
  // ... rest of function
};
```

### Option B: Create Basic Backend (30 minutes)
```bash
# Create backend folder
mkdir backend
cd backend

# Initialize Node project
npm init -y

# Install dependencies
npm install express cors mongodb dotenv

# Create server.js with basic endpoints
# Then: npm start
```

Basic server.js:
```javascript
const express = require('express');
const app = express();

app.use(express.json());
app.use(require('cors')());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Cart endpoint
app.get('/api/cart', (req, res) => {
  res.json({
    cart: {
      items: [],
      restaurant: null
    },
    bill: { subtotal: 0, toPay: 0 }
  });
});

app.listen(5000, () => console.log('Server running on 5000'));
```

### Option C: Deploy to Render.com
1. Push backend code to GitHub
2. Go to https://render.com
3. Connect GitHub account
4. Create new "Web Service"
5. Select backend repository
6. Set environment variables
7. Deploy
8. Update `src/config/api.js` with Render URL

## Decision Tree

```
Do you have backend code?
├─ YES → Go to Step 2 (Start it locally)
└─ NO
    ├─ Want quick demo? → Option A (Mock data)
    ├─ Want to learn? → Option B (Build simple backend)
    └─ Want production? → Option C (Deploy to Render)
```

## Expected Timeline

- **Already have backend**: 2 minutes (just start it)
- **Backend on Render broken**: 5 minutes (restart/redeploy)
- **Creating mock data**: 10 minutes
- **Creating basic backend**: 30 minutes
- **Deploying to Render**: 15 minutes

## Quick Test After Setup

```javascript
// In browser console when app loads:
// Should see:
CartContext: Cart data received: {cart: {items: [...]}}
// NOT:
Network error - Backend server not responding
```

## Success Indicators

✅ Backend is working when you see:
```
Cart fetched successfully: {cart: {...}}
```

❌ Backend is NOT working if you see:
```
Network error - Backend server not responding
```

## Next Steps

1. **Check if backend exists**: `ls backend/`
2. **If yes**: Start it and update URL
3. **If no**: Choose mock data, build simple server, or deploy
4. **Test**: `curl http://localhost:5000/api/health`
5. **Reload app**: Should work!

## Questions?

**Q: Why is cart empty?**
A: Backend not running, so no cart data returned.

**Q: Why can't I add items?**
A: Can't add to backend if backend not running.

**Q: Do I need to change code?**
A: Only the backend URL in `src/config/api.js`.

**Q: Will my frontend break?**
A: No, frontend is perfect. Just need backend.

**Q: How long will it take?**
A: 2-30 minutes depending on your choice above.

---

**Pick ONE option above and start. You'll have cart working in minutes!**
