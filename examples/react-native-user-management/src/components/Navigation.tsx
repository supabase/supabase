import * as React from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import HomeStack from '../features/home';
import AuthStack from '../features/auth';
import {useAuth} from '../features/auth/AuthContext';
import {Linking} from 'react-native';
import {useColorMode} from 'native-base';

export default function Navigation() {
  const {authStatus} = useAuth();
  const darkMode = useColorMode().colorMode === 'dark';

  const linking = {
    prefixes: ['io.supabase.rnquickstart://'],
    async getInitialURL() {
      const url = await Linking.getInitialURL();

      if (url != null) {
        if (url.includes('#')) {
          return url.replace('#', '?');
        } else {
          return url;
        }
      }
    },

    subscribe(listener: any) {
      Linking.addEventListener('url', ({url}) => {
        if (url.includes('#')) {
          listener(url.replace('#', '?'));
        } else {
          listener(url);
        }
      });
    },
  };

  return (
    <NavigationContainer
      theme={darkMode ? DarkTheme : DefaultTheme}
      linking={linking}>
      {authStatus === 'SIGNED_IN' ? <HomeStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
