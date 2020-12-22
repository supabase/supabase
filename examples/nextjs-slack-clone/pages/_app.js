import '~/styles/style.scss'
import React, { useState, useEffect } from 'react'
import Router from 'next/router'
import UserContext from 'lib/UserContext'
import { supabase } from 'lib/Store'

export default function SupabaseSlackClone({Component, pageProps}){
  const [authLoaded, setAuthLoaded] = useState(false)
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null);

  useEffect(() => {
    const session = supabase.auth.session();
    setSession(session);
    setUser(session?.user ?? null);
    setAuthLoaded(session ? true : false)

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoaded(true)
        if (session) {
          Router.push('/channels/[id]', '/channels/1')
        }
      }
    )

    return () => {
      authListener.unsubscribe()
    }
  })

  const signIn = async (id, username) => {
  }
  
  const signOut = () => {
    supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setAuthLoaded(null)
    Router.push('/')
  }  

  return (
    <UserContext.Provider
      value={{
        authLoaded,
        user,
        signIn,
        signOut
      }}
    >
      <Component {...pageProps} />
    </UserContext.Provider>
  )
}
