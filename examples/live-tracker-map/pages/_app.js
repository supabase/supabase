import '../styles/globals.css'
import React, { useState, useEffect } from 'react'
import UserContext from 'lib/UserContext'
import { auth, supabase } from 'lib/Store'

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const authUser = auth.currentUser()
        if (!authUser) return

        const { data: user, error } = await supabase
          .from('users')
          .match({ id: authUser.id })
          .select('*')
          .single()
        if (error) {
          throw new Error(error)
        }
        setUser(user)
      } catch (error) {
        console.log(error)
      }
    }
    loadUser()
  }, [])

  function onSignOut() {
    try {
      const user = auth.currentUser()
      user
        .signOut()
        .then((response) => {
          console.log('User logged out')
          window.location.reload()
        })
        .catch((error) => {
          console.log('Failed to logout user: %o', error)
        })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <UserContext.Provider
      value={{
        user: user,
        signOut: onSignOut,
      }}
    >
      <Component {...pageProps} />
    </UserContext.Provider>
  )
}

export default MyApp
