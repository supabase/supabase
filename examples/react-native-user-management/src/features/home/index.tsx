import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Account from './Account';

const Stack = createNativeStackNavigator();

export type HomeStackParamList = {
  Profile: undefined;
};

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Account" component={Account}></Stack.Screen>
    </Stack.Navigator>
  );
}
