import { createContext, useContext, useEffect, useState } from 'react'

import { supabase } from './supabaseClient'

const UserContext = createContext({ user: null, session: null })

export function UserProvider({ children }) {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))

    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ user: session?.user ?? null, session }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
