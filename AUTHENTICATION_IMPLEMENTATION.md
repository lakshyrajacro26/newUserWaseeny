/**
 * PERSISTENT AUTHENTICATION IMPLEMENTATION
 * Production-ready auth flow for NewWasseny React Native App
 * 
 * ============================================================================
 * PROBLEM SOLVED
 * ============================================================================
 * 
 * User had to re-login after:
 * - App close
 * - App background  
 * - Phone lock
 * 
 * This is now fixed with persistent token storage and centralized auth state.
 * 
 * ============================================================================
 * ARCHITECTURE
 * ============================================================================
 * 
 * SINGLE SOURCE OF TRUTH: AuthContext
 * - Global auth state (isAuthenticated, token, user)
 * - Persistent storage integration (AsyncStorage)
 * - In-memory state for fast access
 * - Read storage ONCE at app launch
 * 
 * NAVIGATION FLOW (UNCHANGED):
 * 1. SplashScreen → waits for auth initialization
 * 2. LanguageSelect → always shown
 * 3. OnBoarding → always shown
 * 4. LoginScreen (if !authenticated) OR MainTabs (if authenticated)
 * 
 * ============================================================================
 * FILES CREATED
 * ============================================================================
 * 
 * src/context/AuthContext.jsx (NEW)
 * - AuthContext: Centralized auth state management
 * - AuthProvider: Wraps app with context
 * - useAuth(): Hook to access auth state and methods
 * 
 * ============================================================================
 * FILES MODIFIED
 * ============================================================================
 * 
 * App.tsx
 * - Wrapped with <AuthProvider> (outermost)
 * - Order: AuthProvider > CartProvider > FavouritesProvider > AppNavigator
 * 
 * src/navigations/AppNavigator.jsx
 * - Updated import to include useAuth
 * - Simplified stack structure (no conditional screens)
 * - OnBoarding will route based on isAuthenticated via useAuth()
 * 
 * src/screens/Onboarding/SplashScreen.jsx
 * - Added useAuth() hook
 * - Waits for isInitialized before continuing
 * - Imports auth state but doesn't decide routing (flexible for future)
 * 
 * src/screens/Onboarding/OnBoarding.jsx
 * - Added useAuth() hook
 * - handleGetStarted() checks isAuthenticated
 * - Routes to MainTabs if authenticated, LoginScreen if not
 * 
 * src/screens/Auth/LoginScreen.jsx
 * - Added useAuth() import
 * - Uses setAuthenticatedUser() after successful login
 * - Saves token + user to AsyncStorage automatically
 * 
 * src/screens/Auth/Signup.jsx
 * - Added useAuth() import
 * - Ready for integration with signup flow
 * 
 * src/screens/Auth/Verify.jsx
 * - Added useAuth() import
 * - After OTP verification, calls setAuthenticatedUser()
 * - Saves token to AsyncStorage on signup completion
 * 
 * src/screens/Profile/ProfileHome.jsx (ALREADY CORRECT)
 * - Already uses useAuth() for logout()
 * - logout() clears AsyncStorage and resets state
 * - Navigation resets to LoginScreen
 * 
 * ============================================================================
 * PRODUCTION PATTERNS IMPLEMENTED
 * ============================================================================
 * 
 * 1. INITIALIZATION AT LAUNCH
 *    - AuthContext reads AsyncStorage only ONCE on app start
 *    - isInitialized flag prevents race conditions
 *    - SplashScreen waits for isInitialized before routing
 * 
 * 2. PREVENT DOUBLE NAVIGATION
 *    - AppNavigator doesn't conditionally render screens
 *    - OnBoarding checks isAuthenticated and routes accordingly
 *    - No tab/conditional stack logic in navigator
 * 
 * 3. TOKEN PERSISTENCE
 *    - AsyncStorage stores: token + user object
 *    - In-memory state for instant access
 *    - Cold start: reads from storage
 *    - Warm start: uses in-memory state
 * 
 * 4. LOGOUT PATTERN
 *    - logout() clears AsyncStorage
 *    - Sets isAuthenticated = false
 *    - Navigation resets to LoginScreen
 *    - Next app launch: reads empty storage, starts at LoginScreen
 * 
 * 5. LOGIN/SIGNUP FLOW
 *    - After API success, call setAuthenticatedUser(token, user)
 *    - This saves to storage AND updates context
 *    - isAuthenticated becomes true
 *    - Continue existing navigation flow (no breaking changes)
 * 
 * ============================================================================
 * EDGE CASES HANDLED
 * ============================================================================
 * 
 * ✓ Cold Start (app never run before)
 *   - No token in AsyncStorage
 *   - isAuthenticated = false
 *   - Routes to LoginScreen
 * 
 * ✓ Warm Start (token exists)
 *   - Reads token from AsyncStorage
 *   - isAuthenticated = true immediately
 *   - Routes to MainTabs after OnBoarding
 * 
 * ✓ App Killed by OS
 *   - AsyncStorage persists across process kill
 *   - Token remains saved
 *   - Next launch restores authentication
 * 
 * ✓ Phone Lock
 *   - App in background, token in AsyncStorage
 *   - Token stays valid (server-side TTL)
 *   - Unlock and resume: authenticated
 * 
 * ✓ Missing/Corrupted Token
 *   - Wrapped in try-catch
 *   - Defaults to not authenticated
 *   - User starts from LoginScreen
 * 
 * ✓ Logout Clears State
 *   - AsyncStorage cleared
 *   - In-memory state reset
 *   - Next launch starts fresh at LoginScreen
 * 
 * ============================================================================
 * TESTING CHECKLIST
 * ============================================================================
 * 
 * 1. Fresh Install
 *    □ App starts → SplashScreen → LanguageSelect → OnBoarding → LoginScreen
 *    □ Login with credentials → OTP Verify → FoodPreference → MainTabs
 *    □ Check: token saved in AsyncStorage
 * 
 * 2. Kill App After Login
 *    □ Login and navigate to home
 *    □ Press app switcher, kill app
 *    □ Relaunch: should skip to MainTabs (not LoginScreen)
 *    □ Check: token still in AsyncStorage
 * 
 * 3. Background/Lock Screen
 *    □ Login to app
 *    □ Lock phone (not killing app)
 *    □ Unlock: should still be authenticated
 * 
 * 4. Logout
 *    □ Navigate to Profile
 *    □ Press Logout
 *    □ Check: AsyncStorage cleared
 *    □ Check: redirected to LoginScreen
 *    □ Kill and relaunch: at LoginScreen (not MainTabs)
 * 
 * 5. Token Expiry (backend)
 *    □ If server returns 401/403, clear token
 *    □ Redirect to LoginScreen
 *    □ (Implement in API interceptor - not in this scope)
 * 
 * ============================================================================
 * API INTEGRATION NOTES
 * ============================================================================
 * 
 * Login Response must include:
 * {
 *   "token": "jwt_token_here" OR "accessToken": "jwt_token_here",
 *   "user": { id, email, name, ... }
 * }
 * 
 * Signup/OTP Response must include:
 * {
 *   "token": "jwt_token_here",
 *   "user": { id, email, name, ... }
 * }
 * 
 * authService.js already handles both patterns:
 * - data?.token
 * - data?.accessToken
 * - data?.data?.token
 * 
 * ============================================================================
 * ZERO UI/UX CHANGES
 * ============================================================================
 * 
 * ✓ No layout changes
 * ✓ No new screens
 * ✓ No navigation refactor
 * ✓ All existing flows work identically
 * ✓ Only invisible persistence added
 * 
 * ============================================================================
 * FUTURE ENHANCEMENTS (Optional)
 * ============================================================================
 * 
 * 1. Token Refresh
 *    - Implement refresh token logic in API interceptor
 *    - Call setAuthenticatedUser() with new token
 * 
 * 2. Biometric Auth
 *    - On resume, check if token valid with refresh
 *    - Or add fingerprint as secondary auth
 * 
 * 3. Session Expiry
 *    - Implement timeout on inactivity
 *    - Call logout() to reset state
 * 
 * 4. Deep Linking
 *    - After auth, navigate to deep link destination
 *    - useEffect in SplashScreen can handle this
 * 
 * ============================================================================
 */
