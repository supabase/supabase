import { Link, Stack } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import AppleSignInButton from '@/components/social-auth-buttons/apple/apple-sign-in-button';
import ExpoAppleSignInButton from '@/components/social-auth-buttons/apple/expo-apple-sign-in-button';
import GoogleSignInButton from '@/components/social-auth-buttons/google/google-sign-in-button';
import { Image } from 'expo-image';

export default function LoginScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />
      <ThemedView style={styles.container}>
        <Image style={styles.image} source={require('@/assets/supabase-logo-icon.svg')} />
        <ThemedText type="title">Login</ThemedText>
        <Link href="/(tabs)/explore" style={styles.link}>
          <ThemedText type="link">Try to navigate to home screen!</ThemedText>
        </Link>

        <ThemedView style={styles.socialAuthButtonsContainer}>
          {Platform.OS === 'ios' && (
              <>
              <ThemedText type="default">Invertase Apple Sign In</ThemedText>
              <AppleSignInButton />
              <ThemedText type="default">Expo Apple Sign In</ThemedText>
              <ExpoAppleSignInButton />
            </>
          )}
          {Platform.OS !== 'ios' && (<AppleSignInButton />)}
          <GoogleSignInButton />
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  socialAuthButtonsContainer: {
    display: 'flex',
    gap: 10,
  },
  image: {
    width: 100,
    height: 100,
  },
});
