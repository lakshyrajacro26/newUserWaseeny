import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthToken, getAuthUser, clearAuth, saveAuth } from '../services/storage';
import apiClient from '../config/apiClient';
import { AUTH_ROUTES } from '../config/routes';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);


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

 
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

 
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


  const logout = useCallback(async () => {
    try {
     
      try {
        await apiClient.post(AUTH_ROUTES.logout);
      } catch (apiError) {
        
        console.warn('Logout API call failed - clearing auth locally:', apiError.message);
      }

      
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


export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
