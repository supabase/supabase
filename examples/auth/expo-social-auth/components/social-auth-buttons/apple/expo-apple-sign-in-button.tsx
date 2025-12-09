import { supabase } from '@/lib/supabase';
import type { SignInWithIdTokenCredentials } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

async function onAppleButtonPress() {
  // Performs login request
  try {
    const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    
    console.log('Apple sign in successful:', { appleAuthRequestResponse })
    
    if (appleAuthRequestResponse.identityToken && appleAuthRequestResponse.authorizationCode) {
      const signInWithIdTokenCredentials: SignInWithIdTokenCredentials = {
        provider: 'apple',
        token: appleAuthRequestResponse.identityToken,
        access_token: appleAuthRequestResponse.authorizationCode,
      }
  
      const { data, error } = await supabase.auth.signInWithIdToken(signInWithIdTokenCredentials)
  
      if (error) {
        console.error('Error signing in with Apple:', error)
      }
  
      if (data) {
        console.log('Apple sign in successful:', data)
        router.navigate('/(tabs)/explore')
      }
    }

  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      console.error('Error signing in with Apple:', e)
    } else {
      console.error('Error signing in with Apple:', e)
    }
  }
}

export default function ExpoAppleSignInButton() {
  if (Platform.OS !== 'ios') { return <></> }
  
  return <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
    cornerRadius={5}
    style={styles.button}
    onPress={() => onAppleButtonPress()}
  />
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 160, height: 45
  },
});
