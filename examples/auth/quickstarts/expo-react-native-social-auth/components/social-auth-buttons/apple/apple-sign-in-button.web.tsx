import { supabase } from '@/lib/supabase';
import type { SignInWithIdTokenCredentials } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import AppleSignin, { type AppleAuthResponse } from 'react-apple-signin-auth';
import { Platform } from 'react-native';

export default function AppleSignInButton() {
  const [nonce, setNonce] = useState('');
  const [sha256Nonce, setSha256Nonce] = useState('');

  async function onAppleButtonSuccess(appleAuthRequestResponse: AppleAuthResponse) {
    console.debug('Apple sign in successful:', { appleAuthRequestResponse });
    if (appleAuthRequestResponse.authorization && appleAuthRequestResponse.authorization.id_token && appleAuthRequestResponse.authorization.code) {
      const signInWithIdTokenCredentials: SignInWithIdTokenCredentials = {
        provider: 'apple',
        token: appleAuthRequestResponse.authorization.id_token,
        nonce,
        access_token: appleAuthRequestResponse.authorization.code,
      };

      const { data, error } = await supabase.auth.signInWithIdToken(signInWithIdTokenCredentials)

      if (error) {
        console.error('Error signing in with Apple:', error);
      }

      if (data) {
        console.log('Apple sign in successful:', data);
      }
    };
  }

  useEffect(() => {
    function generateNonce(): string {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0].toString();
    };

    async function generateSha256Nonce(nonce: string): Promise<string> {
      const buffer = await window.crypto.subtle.digest('sha-256', new TextEncoder().encode(nonce));
      const array = Array.from(new Uint8Array(buffer));
      return array.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    let nonce = generateNonce();
    setNonce(nonce);

    generateSha256Nonce(nonce)
      .then((sha256Nonce) => { setSha256Nonce(sha256Nonce) });
  }, []);

  if (Platform.OS !== 'web') { return <></>; }

  return <AppleSignin
    authOptions={{
      clientId: process.env.EXPO_PUBLIC_APPLE_AUTH_SERVICE_ID ?? '',
      redirectURI: process.env.EXPO_PUBLIC_APPLE_AUTH_REDIRECT_URI ?? '',
      scope: 'email name',
      state: 'state',
      nonce: sha256Nonce,
      usePopup: true,
    }}
    uiType="dark"
    onSuccess={onAppleButtonSuccess}
    onError={(error: any) => console.error('Apple sign in error:', error)}
  />;
}
