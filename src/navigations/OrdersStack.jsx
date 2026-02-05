import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrdersPage from '../screens/Orders/OrdersPage';

const Stack = createNativeStackNavigator();

export default function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersHome" component={OrdersPage} />
    </Stack.Navigator>
  );
}
