import { supabase } from '@/lib/supabase';
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import type { SignInWithIdTokenCredentials } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { Platform } from 'react-native';

async function onAppleButtonPress() {
  // Performs login request
  const appleAuthRequestResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    // Note: it appears putting FULL_NAME first is important, see issue #293
    requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
  });

  // Get the current authentication state for user
  // Note: This method must be tested on a real device. On the iOS simulator it always throws an error.
  const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

  console.log('Apple sign in successful:', { credentialState, appleAuthRequestResponse });

  if (credentialState === appleAuth.State.AUTHORIZED && appleAuthRequestResponse.identityToken && appleAuthRequestResponse.authorizationCode) {
    const signInWithIdTokenCredentials: SignInWithIdTokenCredentials = {
      provider: 'apple',
      token: appleAuthRequestResponse.identityToken,
      nonce: appleAuthRequestResponse.nonce,
      access_token: appleAuthRequestResponse.authorizationCode,
    };

    const { data, error } = await supabase.auth.signInWithIdToken(signInWithIdTokenCredentials);

    if (error) {
      console.error('Error signing in with Apple:', error);
    }

    if (data) {
      console.log('Apple sign in successful:', data);
      router.navigate('/(tabs)');
    }
  }
}

export default function AppleSignInButton() {
  if (Platform.OS !== 'ios') { return <></>; }

  return <AppleButton
    buttonStyle={AppleButton.Style.BLACK}
    buttonType={AppleButton.Type.SIGN_IN}
    style={{ width: 160, height: 45 }}
    onPress={() => onAppleButtonPress()}
  />;
}
