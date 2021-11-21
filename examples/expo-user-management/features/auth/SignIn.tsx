import React from "react";
import { Button, Input, VStack, Text, useToast, Box } from "native-base";
import Layout from "../../components/Layout";
import * as Linking from "expo-linking";
import supabase from "../../services/supabase";
import { useAuth } from "./AuthContext";

export default function SignIn() {
  const [email, setEmail] = React.useState<string>();
  const [isSending, setSending] = React.useState(false);
  const { loginError } = useAuth();
  const toast = useToast();

  async function sendMagicLink(email?: string) {
    let redirectURL = Linking.createURL("/SignIn");
    if (email) {
      setSending(true);
      let result = await supabase.auth.signIn(
        { email },
        { redirectTo: redirectURL }
      );

      setSending(false);

      if (result.error) {
        toast.show({
          placement: "top",
          title: "Sign In",
          status: "error",
          description: "There was a problem sending your link",
        });
      } else {
        toast.show({
          placement: "top",
          title: "Sign In",
          status: "success",
          description: "A sign in link has been sent to your email",
        });
      }
    }
  }

  return (
    <Layout>
      <VStack space={8}>
        <Box>
          {loginError ? (
            <Text color="red.500">Invalid Sign In Code</Text>
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
