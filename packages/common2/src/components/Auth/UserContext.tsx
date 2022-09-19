import React, { useEffect, useState, createContext, useContext } from 'react'
import { SupabaseClient, Session, User } from '@supabase/supabase-js'

export interface AuthSession {
  user: User | null
  session: Session | null
}

const UserContext = createContext<AuthSession>({ user: null, session: null })

export interface Props {
  supabaseClient: SupabaseClient
  [propName: string]: any
}

export const UserContextProvider = (props: Props) => {
  const { supabaseClient } = props
  const [session, setSession] = useState<Session | null>(
    supabaseClient.auth.session()
  )
  const [user, setUser] = useState<User | null>(session?.user ?? null)

  useEffect(() => {
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => {
      authListener?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = {
    session,
    user,
  }
  return <UserContext.Provider value={value} {...props} />
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error(`useUser must be used within a UserContextProvider.`)
  }
  return context
}
