import React from 'react';
import AppNavigator from './src/navigations/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { FavouritesProvider } from './src/context/FavouritesContext';
import { AuthProvider } from './src/context/AuthContext';
import { NetworkProvider } from './src/context/NetworkContext';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/Toasters/popup';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OfflineBanner from './src/components/OfflineBanner';

const App = () => {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <CartProvider>
            <FavouritesProvider>
              <OfflineBanner />
              <AppNavigator />
              <Toast config={toastConfig} />
            </FavouritesProvider>
          </CartProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
};

export default App;
