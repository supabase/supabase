import * as React from "react";
import { useAuth } from "../features/auth/AuthContext";
import { Box } from "native-base";
import Account from "../features/home/Account";
import SignIn from "../features/auth/SignIn";

export default function Navigation() {
  const { authStatus } = useAuth();

  return (
    <Box flex={1}>{authStatus === "SIGNED_IN" ? <Account /> : <SignIn />}</Box>
  );
}
