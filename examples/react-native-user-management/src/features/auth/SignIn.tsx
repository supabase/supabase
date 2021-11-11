import React from 'react';
import {Button, Input, VStack, Text, useToast, Box} from 'native-base';
import Layout from '../../components/Layout';
import supabase from '../../services/supabase';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthStackParamList} from '.';

export type SignInProps = NativeStackScreenProps<
  AuthStackParamList,
  'login-callback' | 'SignIn'
>;

export default function SignIn({route}: SignInProps) {
  const [email, setEmail] = React.useState<string>();
  const [isSending, setSending] = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    if (route.params?.refresh_token) {
      supabase.auth.signIn({refreshToken: route.params.refresh_token});
    }
  }, [route]);

  async function sendMagicLink(email?: string) {
    if (email) {
      setSending(true);
      let result = await supabase.auth.signIn(
        {email},
        {redirectTo: 'io.supabase.rnquickstart://login-callback/'},
      );

      setSending(false);

      if (result.error) {
        toast.show({
          placement: 'top',
          title: 'Sign In',
          status: 'error',
          description: 'There was a problem sending your link',
        });
      } else {
        toast.show({
          placement: 'top',
          title: 'Sign In',
          status: 'success',
          description: 'A sign in link has been sent to your email',
        });
      }
    }
  }

  return (
    <Layout>
      <VStack space={8}>
        <Box>
          <Text bold color="red.500">
            {route.params?.error_description}
          </Text>
          {route.params?.error_code ? (
            <Text>You can send another magic link</Text>
          ) : null}
        </Box>
        <Input
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Enter your email address"
          onChangeText={setEmail}
        />

        <Button isLoading={isSending} onPress={() => sendMagicLink(email)}>
          Send magic link
        </Button>
      </VStack>
    </Layout>
  );
}
