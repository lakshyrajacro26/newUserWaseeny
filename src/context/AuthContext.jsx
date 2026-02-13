import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkVerificationStatusApi, loginApi, logoutApi } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      
      const storedUser = await AsyncStorage.getItem('userData');
      const storedToken = await AsyncStorage.getItem('auth_token');

      if (!storedUser) {
        setUser(null);
        return;
      }
      
      setUser(JSON.parse(storedUser));
      
     
      if (storedToken) {
        console.log('✅ [AuthContext] Auth token found in storage');
      } else {
        console.warn('⚠️ [AuthContext] No auth token in storage');
      }
     
   
    } catch (error) {
      setUser(null);
      await AsyncStorage.removeItem('userData');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await loginApi({ email, password });
      console.log("response", response.data);
      
      const { user, token, accessToken } = response.data;
      
     
      const authToken = token || accessToken;
      if (authToken) {
        await AsyncStorage.setItem('auth_token', authToken);
        console.log('✅ [AuthContext] Auth token saved to storage');
      } else {
        console.warn('⚠️ [AuthContext] No token in login response - using cookie-based auth');
      }

      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        setUser(user);
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Something went wrong, please try again',
      };
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout API error:', error);
    }
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);