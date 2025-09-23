import { useAuthContext } from '@/hooks/use-auth-context';
import { supabase } from '@/lib/supabase';
import React from 'react';
import { Button } from 'react-native';

async function onSignOutButtonPress() {
 const { error } = await supabase.auth.signOut()

 if (error) {
   console.error('Error signing out:', error)
 }
}

export default function SignOutButton() {
  const { isLoggedIn } = useAuthContext();

  return (
    <Button
      disabled={!isLoggedIn}
      title="Sign out"
      onPress={onSignOutButtonPress}
    />
  );
}