import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomePage from '../screens/Home/HomePage.jsx';
import RestaurantDetail from '../screens/Orders/RestaurantDetail';
import CartScreen from '../screens/Cart';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomePage" component={HomePage} />

      <Stack.Screen name="RestaurantDetail" component={RestaurantDetail} />

      <Stack.Screen name="Cart" component={CartScreen} />
    </Stack.Navigator>
  );
}
