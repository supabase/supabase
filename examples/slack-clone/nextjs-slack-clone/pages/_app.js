import '~/styles/style.scss'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import UserContext from 'lib/UserContext'
import { supabase, fetchUserRoles } from 'lib/Store'

export default function SupabaseSlackClone({ Component, pageProps }) {
  const [userLoaded, setUserLoaded] = useState(false)
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [userRoles, setUserRoles] = useState([])
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }}) => {
      setSession(session)
      setUserLoaded(session ? true : false)
      if (session?.user) {
        signIn()
        router.push('/channels/[id]', '/channels/1')
      }
    })


    const { subscription: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      const currentUser = session?.user
      setUser(currentUser ?? null)
      setUserLoaded(!!currentUser)
      if (currentUser) {
        signIn(currentUser.id, currentUser.email)
        router.push('/channels/[id]', '/channels/1')
      }
    })

    return () => {
      authListener.unsubscribe()
    }
  }, [])

  const signIn = async () => {
    await fetchUserRoles((userRoles) => setUserRoles(userRoles.map((userRole) => userRole.role)))
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/')
    }
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
