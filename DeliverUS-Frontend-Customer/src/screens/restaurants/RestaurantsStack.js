import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import RestaurantDetailScreen from './RestaurantDetailScreen'
import RestaurantsScreen from './RestaurantsScreen'

const Stack = createNativeStackNavigator()

export default function RestaurantsStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name='RestaurantsScreen'
        component={RestaurantsScreen}
        options={{
          title: 'Restaurants'
        }} />
      <Stack.Screen
        name='RestaurantDetailScreen'
        component={RestaurantDetailScreen}
        options={{
          title: 'Restaurant Detail'
        }} />
    <Stack.Screen
        name='ConfirmOrderScreen'
        component={ConfirmOrderScreen}
        options={{
          title: 'Confirm your order'
        }} />
      <Stack.Screen
        name='ConfirmOrderScreenYes'
        component={ConfirmOrderScreenYes}
        options={{
          title: 'Confirm your order'
        }} />
      <Stack.Screen
        name='ConfirmOrderScreenNo'
        component={ConfirmOrderScreenNo}
        options={{
          title: 'Confirm your order'
        }}
      />
      <Stack.Screen
        name='OrdersScreen'
        component={OrdersScreen}
        options={{
          title: 'My Orders'
        }}
      />
      <Stack.Screen
        name='OrderDetailScreen'
        component={OrderDetailScreen}
        options={{
          title: 'Order Detail'
        }}
      />
    </Stack.Navigator>
  )
}
