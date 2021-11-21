import { Session } from "@supabase/gotrue-js";
import { PostgrestError } from "@supabase/postgrest-js";
import React from "react";
import * as Linking from "expo-linking";
import supabase from "../../services/supabase";
import { Profile } from "../../types/Profile";
import { Spinner } from "native-base";

type AuthStatus = "SIGNED_IN" | "SIGNED_OUT" | "LOADING";

interface AuthContextValue {
  authStatus: AuthStatus;
  profile?: Profile;
  loginError: boolean;
  setProfile: (profile: Profile) => void;
  signOut: () => void;
}

const AuthContext = React.createContext<AuthContextValue>({
  loginError: false,
  authStatus: "SIGNED_OUT",
  setProfile: (profile: Profile) => {},
  signOut: () => {},
});

interface AuthProviderProps {
  children: React.ReactElement | React.ReactElement[];
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [authStatus, setAuthStatus] = React.useState<AuthStatus>("SIGNED_OUT");
  const [loginError, setLoginError] = React.useState(false);

  const [profile, setProfile] = React.useState<Profile>();

  async function extractSessionFromLink(link: string) {
    let parsedURL = Linking.parse(link.replace("#", "?")!);

    if (parsedURL.queryParams.refresh_token) {
      supabase.auth.signIn({
        refreshToken: parsedURL.queryParams.refresh_token,
      });

      setLoginError(false);
    } else if (parsedURL.queryParams.error_code) {
      setLoginError(true);
    }
  }

  React.useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        extractSessionFromLink(url!);
      }
    });

    function handler(res: { url: string }) {
      if (res.url) {
        extractSessionFromLink(res.url);
      }
    }

    Linking.addEventListener("url", handler);

    return () => {
      Linking.removeEventListener("url", handler);
    };
  }, []);

  async function getProfile(
    id: string
  ): Promise<{ profile: Profile | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from<Profile>("profiles")
      .select()
      .eq("id", id);

    if (data && data.length > 0) {
      return { profile: data[0], error };
    } else {
      return { profile: null, error };
    }
  }

  function getProfileFromSession(session: Session) {
    if (session?.user) {
      getProfile(session.user.id).then(({ profile, error }) => {
        if (profile) {
          setProfile(profile);
          setAuthStatus("SIGNED_IN");
        } else {
          setAuthStatus("SIGNED_OUT");
        }
      });
    } else {
      setAuthStatus("SIGNED_OUT");
    }
  }

  function signOut() {
    supabase.auth.signOut().then(() => {
      setProfile(undefined);
    });
  }

  React.useEffect(() => {
    let session = supabase.auth.session();
    if (session) {
      getProfileFromSession(session);
    }

    supabase.auth.onAuthStateChange((event, session) => {
      session && getProfileFromSession(session);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ authStatus, profile, setProfile, signOut, loginError }}
    >
      {authStatus === "LOADING" ? <Spinner /> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
