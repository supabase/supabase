import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SignIn from './SignIn';

const Stack = createNativeStackNavigator();

export type AuthStackParamList = {
  SignIn: undefined;
  'login-callback': {
    error_code: number;
    error_description: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    type: string;
  };
};

export default function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SignIn" component={SignIn}></Stack.Screen>
      <Stack.Screen
        name="login-callback"
        component={SignIn}
        options={{title: 'SignIn'}}></Stack.Screen>
    </Stack.Navigator>
  );
}
