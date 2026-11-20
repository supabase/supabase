import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

type SupabaseContextType = {
  supabase: typeof supabase
  user: User | null
}

const SupabaseContext = createContext<SupabaseContextType>({ supabase, user: null })

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))

    return () => subscription.unsubscribe()
  }, [])

  return <SupabaseContext.Provider value={{ supabase, user }}>{children}</SupabaseContext.Provider>
}

export const useSupabaseClient = () => useContext(SupabaseContext).supabase
export const useUser = () => useContext(SupabaseContext).user
