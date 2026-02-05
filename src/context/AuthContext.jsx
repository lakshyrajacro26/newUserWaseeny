import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthToken, getAuthUser, clearAuth, saveAuth } from '../services/storage';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * PRODUCTION PATTERN: Initialize auth state once at app launch
   * Reads from AsyncStorage only once, avoiding repeated disk I/O
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await getAuthToken();
      const storedUser = await getAuthUser();

      if (storedToken) {
        setToken(storedToken);
        setUser(storedUser || null);
        setIsAuthenticated(true);
      } else {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Set authenticated user (called after login/signup)
   * Saves to AsyncStorage immediately for persistence
   */
  const setAuthenticatedUser = useCallback(async (newToken, newUser) => {
    try {
      await saveAuth({ token: newToken, user: newUser });
      setToken(newToken);
      setUser(newUser || null);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to set authenticated user:', error);
      throw error;
    }
  }, []);

  /**
   * Logout handler
   * Clears AsyncStorage and resets in-memory state
   */
  const logout = useCallback(async () => {
    try {
      await clearAuth();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }, []);

  const value = {
    isAuthenticated,
    user,
    token,
    isLoading,
    isInitialized,
    setAuthenticatedUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 * Production apps should always check isInitialized before routing
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
