import '~/styles/style.scss'
import React, { useState, useEffect } from 'react'
import Router from 'next/router'
import UserContext from 'lib/UserContext'
import { supabase } from 'lib/Store'

export default function SupabaseSlackClone({Component, pageProps}){
  const [userLoaded, setUserLoaded] = useState(false)
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null);

  useEffect(() => {
    const session = supabase.auth.session();
    setSession(session);
    setUser(session?.user ?? null);
    setUserLoaded(session ? true : false)
    if (user) {
      signIn(user.id, user.email)
      Router.push('/channels/[id]', '/channels/1')
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        const currentUser = session?.user
        setUser(currentUser ?? null);
        setUserLoaded(!!currentUser)
        if (currentUser) {
          signIn(currentUser.id, currentUser.email)
          Router.push('/channels/[id]', '/channels/1')
        }
      }
    )

    return () => {
      authListener.unsubscribe()
    }
  }, [user])

  const signIn = async (id, username) => {
    const { body } = await supabase.from('users').select('id, username').eq('id', id)
    const result = body[0]

    // If the user exists in the users table, update the username.
    // If not, create a new row.
    result?.id
      ? await supabase.from('users').update({ id, username }).match({ id }).single()
      : await supabase.from('users').insert([{ id, username }]).single()
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
        signIn,
        signOut
      }}
    >
      <Component {...pageProps} />
    </UserContext.Provider>
  )
}
