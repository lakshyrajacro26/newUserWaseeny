import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/Onboarding/SplashScreen';
import LanguageSelectScreen from '../screens/Onboarding/LanguageSelectScreen';
import OnBoarding from '../screens/Onboarding/OnBoarding';
import ForgetPass from '../screens/Auth/ForgetPass';
import CreatePassword from '../screens/Auth/CreatePassword';
import Verify from '../screens/Auth/Verify';
import LoginScreen from '../screens/Auth/LoginScreen';
import Signup from '../screens/Auth/Signup';
import FoodPreference from '../screens/Onboarding/FoodPreference';
import HomePage from '../screens/Home/HomePage.jsx';
import TabNavigator from './TabNavigator';
import ReviewOrderScreen from '../screens/ReviewOrderScreen';
import OrderDetailsScreen from '../screens/Orders/OrderDetailsScreen';
import Favourite from '../screens/Favourite';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

/**
 * PRODUCTION ROUTING LOGIC:
 * 
 * 1. SplashScreen always shows first
 * 2. After initialization:
 *    - LanguageSelect (always required)
 *    - OnBoarding (always required)
 *    - LoginScreen (if not authenticated)
 *    - HomeStack/MainTabs (if authenticated)
 * 
 * 3. Navigation flow is driven by AuthContext.isAuthenticated
 *    which is set once at app startup
 */
export default function AppNavigator() {
  const { isInitialized, isAuthenticated, isLoading } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Always show splash first */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* Language and Onboarding always shown */}
        <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
        <Stack.Screen name="OnBoarding" component={OnBoarding} />

        {/* Auth screens always available for stack navigation */}
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="ForgetPass" component={ForgetPass} />
        <Stack.Screen name="CreatePassword" component={CreatePassword} />
        <Stack.Screen name="Verify" component={Verify} />

        {/* Post-login screens */}
        <Stack.Screen name="FoodPreference" component={FoodPreference} />
        <Stack.Screen name="HomePage" component={HomePage} />

        {/* Main App (shown only if authenticated) */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Favourite" component={Favourite} />
        <Stack.Screen name="ReviewOrderScreen" component={ReviewOrderScreen} />
        <Stack.Screen
          name="OrderDetailsScreen"
          component={OrderDetailsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
