# Production Authentication Implementation Guide

## Overview

This implementation provides **persistent authentication** for a React Native mobile app following Zomato/Swiggy patterns. The user logs in once, and authentication persists across app lifecycle events: app close, background, phone lock, OS kill.

---

## Architecture

### Core Components

#### 1. **AuthContext** (`src/context/AuthContext.jsx`)
- Single source of truth for authentication state
- Manages: `isAuthenticated`, `isLoading`, `token`, `user`
- Methods: `login()`, `logout()`, `loadAuthFromStorage()`

**Key Design Pattern:**
```
In-Memory State + AsyncStorage Persistence
- In-memory: Fast access for current session
- AsyncStorage: Survives app kill/background
- Load ONCE at app launch, not on every render
```

#### 2. **Storage Service** (`src/services/storage.js`)
- Handles AsyncStorage operations
- Keys: `auth_token`, `auth_user`
- Provides: `getAuthToken()`, `getAuthUser()`, `clearAuth()`

---

## Flow Diagrams

### Cold Start (App Killed)
```
App Launches
  ↓
SplashScreen mounts
  ↓
AuthContext.loadAuthFromStorage() called
  ↓
Reads token from AsyncStorage
  ↓
isLoading = false
isAuthenticated = token exists? true : false
  ↓
Navigation decides: LanguageSelect → OnBoarding → (HomeStack OR LoginScreen)
```

### Login Flow
```
LoginScreen
  ↓
User enters credentials
  ↓
login({ email, password }) called
  ↓
Backend validates → returns token + user
  ↓
authContextLogin({ token, user })
  ├─ saveAuth() → AsyncStorage (persists)
  └─ setIsAuthenticated(true) → in-memory (immediate)
  ↓
Navigation.replace('MainTabs')
```

### Logout Flow
```
ProfileHome → Logout button
  ↓
logout() called
  ↓
clearAuth() → AsyncStorage cleared
setIsAuthenticated(false)
  ↓
AppNavigator sees isAuthenticated = false
  ├─ Removes MainTabs screens
  └─ Shows LoginScreen
  ↓
Navigation.replace('LoginScreen')
```

### Warm Start (App Open from Background)
```
SplashScreen mounts (again)
  ↓
loadAuthFromStorage() called (reads from AsyncStorage)
  ↓
Token still exists → isAuthenticated = true
  ↓
OnBoarding completed → MainTabs shown (user stays logged in)
```

---

## Navigation Flow (STRICT - NO CHANGES)

```
User NOT Logged In:
  SplashScreen → LanguageSelectScreen → OnBoarding → LoginScreen

User Already Logged In:
  SplashScreen → LanguageSelectScreen → OnBoarding → HomeStack (MainTabs)
```

**Key Rules:**
- Language selection ALWAYS runs
- Onboarding ALWAYS runs
- Only final destination changes based on `isAuthenticated`

---

## Implementation Details

### 1. AuthContext (`src/context/AuthContext.jsx`)

**State Variables:**
- `isAuthenticated` - boolean (token exists)
- `isLoading` - boolean (loading from AsyncStorage)
- `token` - string (JWT/bearer token)
- `user` - object (user profile data)

**Methods:**

**loadAuthFromStorage()** - Called by SplashScreen
```javascript
// Reads token from AsyncStorage once at app launch
// Handles errors gracefully (corrupted token, missing token)
// Sets isLoading = false when complete
const storedToken = await getAuthToken();
if (storedToken) {
  setToken(storedToken);
  setIsAuthenticated(true);
}
```

**login(token, user)** - Called by LoginScreen
```javascript
// On login success:
// 1. Save to AsyncStorage (persist)
// 2. Update in-memory state (immediate)
await saveAuth({ token, user });
setToken(token);
setIsAuthenticated(true);
```

**logout()** - Called by ProfileHome
```javascript
// On logout:
// 1. Clear AsyncStorage
// 2. Clear in-memory state
// 3. AppNavigator removes MainTabs
await clearAuth();
setToken(null);
setIsAuthenticated(false);
```

---

### 2. App.tsx (Provider Setup)

```typescript
const App = () => {
  return (
    <AuthProvider>           {/* Outermost - initializes auth */}
      <CartProvider>
        <FavouritesProvider>
          <AppNavigator />   {/* Uses AuthContext for routing */}
          <Toast />
        </FavouritesProvider>
      </CartProvider>
    </AuthProvider>
  );
};
```

**Why AuthProvider is outermost:**
- All providers need access to auth state
- Auth must initialize before navigation runs
- Prevents race conditions

---

### 3. SplashScreen (`src/screens/Onboarding/SplashScreen.jsx`)

```javascript
const { isLoading, isAuthenticated, loadAuthFromStorage } = useAuth();

useEffect(() => {
  // Wait for token to load from AsyncStorage
  if (!isLoading) {
    // Proceed to language selection
    navigation.replace('LanguageSelect');
  }
}, [isLoading]);
```

**Key Points:**
- Calls `loadAuthFromStorage()` via AuthContext
- Waits for `isLoading` to become false
- Does NOT check `isAuthenticated` here (always shows onboarding)
- Delay: 2 seconds (splash screen display time)

---

### 4. AppNavigator (`src/navigations/AppNavigator.jsx`)

```javascript
export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    // Loading auth state - show only splash
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator>
      {/* Always shown */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <Stack.Screen name="OnBoarding" component={OnBoarding} />

      {/* Conditional: Auth vs Main App */}
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          {/* Other auth screens */}
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          {/* App screens */}
        </>
      )}
    </Stack.Navigator>
  );
}
```

**Conditional Screen Groups:**
- `!isAuthenticated` → Shows LoginScreen, Signup, etc.
- `isAuthenticated` → Shows MainTabs, HomePage, etc.
- Screens in one group are NOT in memory when opposite condition is true

---

### 5. LoginScreen (`src/screens/Auth/LoginScreen.jsx`)

```javascript
const { login: authContextLogin } = useAuth();

const handleLogin = async () => {
  try {
    // Call backend
    const data = await login({ email, password });
    const token = data?.token;
    const user = data?.user;

    // CRITICAL: Save to AuthContext + AsyncStorage
    await authContextLogin({ token, user });

    // Navigation continues (no manual navigation needed)
    Toast.show({
      onHide: () => navigation.reset({ 
        routes: [{ name: 'MainTabs' }] 
      })
    });
  } catch (error) {
    // Show error toast
  }
};
```

**Key Points:**
- Calls `authContextLogin()` to persist token
- Does NOT manually navigate to MainTabs
- AuthContext state change triggers AppNavigator update
- Navigation change is automatic via conditional screens

---

### 6. OnBoarding (`src/screens/Onboarding/OnBoarding.jsx`)

```javascript
const { isAuthenticated } = useAuth();

const handleGetStarted = () => {
  if (isAuthenticated) {
    // Returning user (has persisted token)
    navigation.replace('MainTabs');
  } else {
    // New user
    navigation.replace('LoginScreen');
  }
};
```

**Flow:**
1. User sees onboarding (always)
2. Clicks "Get Started"
3. Checks `isAuthenticated`
4. Routes to MainTabs (logged in) or LoginScreen (new user)

---

### 7. ProfileHome (Logout) (`src/screens/Profile/ProfileHome.jsx`)

```javascript
const { logout } = useAuth();

const handleLogout = async () => {
  try {
    // Clear token from AsyncStorage + auth state
    await logout();

    // Reset navigation
    rootNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }]
      })
    );
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

**Effect:**
1. `logout()` clears AsyncStorage
2. `isAuthenticated` becomes false
3. AppNavigator removes MainTabs, shows LoginScreen
4. User sees LoginScreen (forced re-authentication)

---

## Edge Cases Handled

### 1. Cold Start (App Killed)
- SplashScreen → loadAuthFromStorage() → reads AsyncStorage
- Token found → MainTabs (user stays logged in)
- Token missing → LoginScreen (forces re-login)

### 2. Warm Start (App Background)
- Token in memory → navigation state maintained
- SplashScreen loading = false immediately
- User resumes where they left off

### 3. Corrupted Token
- AsyncStorage read throws error → caught in loadAuthFromStorage()
- isAuthenticated defaults to false
- User redirected to LoginScreen

### 4. Missing Token
- getAuthToken() returns null
- isAuthenticated = false
- User sees LoginScreen

### 5. Double Navigation Prevention
- AppNavigator uses conditional `{isAuthenticated}` blocks
- Screens are NOT in memory simultaneously
- No accidental deep linking to auth-required screens

### 6. OS Kills App
- Token persisted in AsyncStorage
- Next cold start reads token
- User stays authenticated

---

## Testing Scenarios

### Test 1: First Login
```
1. Fresh install (no token in AsyncStorage)
2. SplashScreen → LanguageSelect → OnBoarding
3. User enters credentials on LoginScreen
4. Token saved to AsyncStorage
5. Navigation to MainTabs ✓
6. Close app and reopen
7. Token loaded automatically ✓
8. User sees HomeStack (not LoginScreen) ✓
```

### Test 2: Logout
```
1. Open app (already logged in)
2. Navigate to Profile → Logout
3. logout() clears AsyncStorage
4. AppNavigator shows LoginScreen ✓
5. Close app and reopen
6. No token in AsyncStorage ✓
7. User sees LoginScreen ✓
```

### Test 3: App Kill
```
1. User logged in, using app
2. OS kills app (home button, crash, memory pressure)
3. Reopen app
4. SplashScreen → loadAuthFromStorage()
5. Token read from AsyncStorage ✓
6. User resumes at MainTabs ✓
```

### Test 4: Background/Foreground
```
1. User on HomeStack
2. Press home button (app background)
3. Reopen app
4. Token still in memory ✓
5. User resumes at HomeStack ✓
6. No re-authentication ✓
```

---

## Security Considerations

### Token Storage
- Stored in AsyncStorage (default, consider moving to SecureStore for production)
- NOT stored in Redux/Context alone (lost on app kill)
- NOT stored in SharedPreferences/UserDefaults (unencrypted)

### Token Expiration
- Currently: no expiration check
- **To add:** Check token validity before MainTabs
- **Recommendation:** Add refresh token mechanism

### Headers
- Ensure `apiClient` adds token to every request
```javascript
// In apiClient configuration
apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

## Code Summary

### Files Modified
1. **Created:** `src/context/AuthContext.jsx` (new)
2. **Modified:** `App.tsx` (added AuthProvider)
3. **Modified:** `src/navigations/AppNavigator.jsx` (added conditional routing)
4. **Modified:** `src/screens/Onboarding/SplashScreen.jsx` (load token)
5. **Modified:** `src/screens/Auth/LoginScreen.jsx` (save token)
6. **Modified:** `src/screens/Onboarding/OnBoarding.jsx` (route based on auth)
7. **Modified:** `src/screens/Profile/ProfileHome.jsx` (logout)

### Key Functions
- `AuthContext.loadAuthFromStorage()` - Load from AsyncStorage
- `AuthContext.login()` - Save token
- `AuthContext.logout()` - Clear token
- `useAuth()` - Hook to access auth state

---

## Production Checklist

- [x] Token persisted in AsyncStorage
- [x] Single source of truth (AuthContext)
- [x] Read token once at app launch
- [x] Conditional routing based on auth state
- [x] Logout clears token + redirects
- [x] Language selection always runs
- [x] Onboarding always runs
- [x] No navigation refactor
- [x] No UI changes
- [x] No hacks or shortcuts
- [ ] (TODO) Add token refresh mechanism
- [ ] (TODO) Add token expiration validation
- [ ] (TODO) Move token to SecureStore (Android KeyStore / iOS Keychain)
- [ ] (TODO) Add offline detection + retry queue

---

## Troubleshooting

### Issue: User logged out on app reopen
**Solution:** Check if AsyncStorage is clearing token. Verify `saveAuth()` is called in login handler.

### Issue: Infinite loading on SplashScreen
**Solution:** Ensure `loadAuthFromStorage()` is called. Check if promise is resolved.

### Issue: User sees LoginScreen but is already logged in
**Solution:** Check if AppNavigator conditional is correct. Verify `isAuthenticated` state in DevTools.

### Issue: Cannot logout
**Solution:** Ensure `logout()` is awaited. Check if `clearAuth()` is removing token from AsyncStorage.

### Issue: Token not persisted after app close
**Solution:** Add logging to `saveAuth()`. Verify AsyncStorage permissions on Android/iOS.

---

## Future Enhancements

1. **Token Refresh**
   - Implement refresh token mechanism
   - Auto-refresh on 401 response
   - Queue requests while refreshing

2. **Token Expiration**
   - Store token expiry time
   - Check expiry before showing MainTabs
   - Redirect to LoginScreen if expired

3. **Secure Storage**
   - Replace AsyncStorage with `react-native-keychain` or `expo-secure-store`
   - Encrypt sensitive data

4. **Offline Support**
   - Cache authenticated state locally
   - Detect internet before making requests
   - Queue requests when offline, retry when online

5. **Deep Linking**
   - Handle deep links in authenticated state
   - Prevent accidental logout on deep link

---

## Questions & Support

For questions about this implementation, refer to:
- Architecture comments in `AuthContext.jsx`
- Flow diagrams in this guide
- Test scenarios section
