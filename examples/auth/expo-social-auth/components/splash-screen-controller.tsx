import { useAuthContext } from '@/hooks/use-auth-context';
import { SplashScreen } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useAuthContext();

  if (!isLoading) {
    console.log('SplashScreenController - Hiding splash screen');
    SplashScreen.hideAsync();
  }

  return null;
}