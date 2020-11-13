import { useEffect, useState } from 'react';
import { supabase } from './initSupabase';

const useUser = () => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setSession(supabase.auth.session());
    setUser(supabase.auth.user());
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Supbase auth event: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);
      }
    );
    return () => {
      authListener.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, session };
};

export { useUser };
