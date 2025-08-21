import { Link, Stack } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppleSignInButton from '@/components/social-auth-buttons/apple/AppleSignInButton';
import ExpoAppleSignInButton from '@/components/social-auth-buttons/apple/ExpoAppleSignInButton';

export default function LoginScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />
      <ThemedView style={styles.container}>
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
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  socialAuthButtonsContainer: {
    gap: 10,
  },
});
