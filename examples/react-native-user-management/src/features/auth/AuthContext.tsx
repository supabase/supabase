import {AuthChangeEvent, Session} from '@supabase/gotrue-js';
import {PostgrestError} from '@supabase/postgrest-js';
import React from 'react';
import supabase from '../../services/supabase';
import {Profile} from '../../types/Profile';

type AuthStatus = AuthChangeEvent;

interface AuthContextValue {
  authStatus: AuthStatus;
  profile?: Profile;
  setProfile: (profile: Profile) => void;
  signOut: () => void;
}

const AuthContext = React.createContext<AuthContextValue>({
  authStatus: 'SIGNED_OUT',
  setProfile: (profile: Profile) => {},
  signOut: () => {},
});

interface AuthProviderProps {
  children: React.ReactElement | React.ReactElement[];
}

export default function AuthProvider({children}: AuthProviderProps) {
  const [authStatus, setAuthStatus] = React.useState<AuthStatus>('SIGNED_OUT');
  const [profile, setProfile] = React.useState<Profile>();

  async function getProfile(
    id: string,
  ): Promise<{profile: Profile | null; error: PostgrestError | null}> {
    const {data, error} = await supabase
      .from<Profile>('profiles')
      .select()
      .eq('id', id);

    if (data && data.length > 0) {
      return {profile: data[0], error};
    } else {
      return {profile: null, error};
    }
  }

  function getProfileFromSession(session: Session) {
    if (session?.user) {
      getProfile(session.user.id).then(({profile, error}) => {
        if (profile) {
          setProfile(profile);
        }
      });
    }
  }

  function signOut() {
    supabase.auth.signOut().then(() => {
      setProfile(undefined);
    });
  }

  React.useEffect(() => {
    let session = supabase.auth.session();
    session && getProfileFromSession(session);

    supabase.auth.onAuthStateChange((event, session) => {
      setAuthStatus(event);
      session && getProfileFromSession(session);
    });
  }, []);

  return (
    <AuthContext.Provider value={{authStatus, profile, setProfile, signOut}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
