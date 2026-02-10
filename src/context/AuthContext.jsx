import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkVerificationStatusApi, loginApi } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 1️⃣ Check local user
      const storedUser = await AsyncStorage.getItem('userData');

      if (!storedUser) {
        setUser(null);
        return;
      }
        setUser(JSON.parse(storedUser));
     
      // 2️⃣ OPTIONAL but BEST: verify cookie with backend
      // const response = await checkVerificationStatusApi(); // protected API
      // setUser(response.data.user);
    } catch (error) {
      setUser(null);
      await AsyncStorage.removeItem('userData');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await loginApi({ email, password });
      console.log("response", response.data)
      const { user } = response.data;

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
    await AsyncStorage.removeItem('userData');
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);