import '~/styles/style.scss'
import React, { useState, useEffect } from 'react'
import Router from 'next/router'
import UserContext from 'lib/UserContext'
import { supabase, fetchUserRoles } from 'lib/Store'

export default function SupabaseSlackClone({ Component, pageProps }) {
  const [userLoaded, setUserLoaded] = useState(false)
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [userRoles, setUserRoles] = useState([])

  useEffect(() => {
    const session = supabase.auth.session()
    setSession(session)
    setUser(session?.user ?? null)
    setUserLoaded(session ? true : false)
    if (user) {
      signIn()
      Router.push('/channels/[id]', '/channels/1')
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      const currentUser = session?.user
      setUser(currentUser ?? null)
      setUserLoaded(!!currentUser)
      if (currentUser) {
        signIn(currentUser.id, currentUser.email)
        Router.push('/channels/[id]', '/channels/1')
      }
    })

    return () => {
      authListener.unsubscribe()
    }
  }, [user])

  const signIn = async () => {
    await fetchUserRoles((userRoles) => setUserRoles(userRoles.map((userRole) => userRole.role)))
  }

  const signOut = async () => {
    const result = await supabase.auth.signOut()
    Router.push('/')
  }

  return (
    <UserContext.Provider
      value={{
        userLoaded,
        user,
        userRoles,
        signIn,
        signOut,
      }}
    >
      <Component {...pageProps} />
    </UserContext.Provider>
  )
}
