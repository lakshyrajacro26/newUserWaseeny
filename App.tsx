import React from 'react';
import AppNavigator from './src/navigations/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { FavouritesProvider } from './src/context/FavouritesContext';
import { AuthProvider } from './src/context/AuthContext';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/Toasters/popup';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <FavouritesProvider>
            <AppNavigator />
            <Toast config={toastConfig} />
          </FavouritesProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
