import { supabase } from '@/lib/supabase';
import { appleAuthAndroid, AppleButton } from '@invertase/react-native-apple-authentication';
import { SignInWithIdTokenCredentials } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

async function onAppleButtonPress() {
  // Generate secure, random values for state and nonce
  const rawNonce = uuid();
  const state = uuid();

  // Configure the request
  appleAuthAndroid.configure({
    // The Service ID you registered with Apple
    clientId: process.env.EXPO_PUBLIC_APPLE_AUTH_SERVICE_ID ?? '',

    // Return URL added to your Apple dev console. We intercept this redirect, but it must still match
    // the URL you provided to Apple. It can be an empty route on your backend as it's never called.
    redirectUri: process.env.EXPO_PUBLIC_APPLE_AUTH_REDIRECT_URI ?? '',

    // The type of response requested - code, id_token, or both.
    responseType: appleAuthAndroid.ResponseType.ALL,

    // The amount of user information requested from Apple.
    scope: appleAuthAndroid.Scope.ALL,

    // Random nonce value that will be SHA256 hashed before sending to Apple.
    nonce: rawNonce,

    // Unique state value used to prevent CSRF attacks. A UUID will be generated if nothing is provided.
    state,
  });

  // Open the browser window for user sign in
  const credentialState = await appleAuthAndroid.signIn();
  console.log('Apple sign in successful:', credentialState);

  if (credentialState.id_token && credentialState.code && credentialState.nonce) {
    const signInWithIdTokenCredentials: SignInWithIdTokenCredentials = {
      provider: 'apple',
      token: credentialState.id_token,
      nonce: credentialState.nonce,
      access_token: credentialState.code,
    };

    const { data, error } = await supabase.auth.signInWithIdToken(signInWithIdTokenCredentials);

    if (error) {
      console.error('Error signing in with Apple:', error);
    }

    if (data) {
      console.log('Apple sign in successful:', data);
    }
  }
}

export default function AppleSignInButton() {
  if (Platform.OS !== 'android' || appleAuthAndroid.isSupported !== true) { return <></> }

  return <AppleButton
    buttonStyle={AppleButton.Style.BLACK}
    buttonType={AppleButton.Type.SIGN_IN}
    onPress={() => onAppleButtonPress()}
  />;
}
