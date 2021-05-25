import '../styles/globals.css'
import React, { useState, useEffect } from 'react'
import { supabase } from 'lib/api'
import { AppContext } from 'lib/constants'

function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState(null)

  useEffect(() => {
    setSession(supabase.auth.session())

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      console.log('session state change', session)
    })
  }, [])

  return (
    <AppContext.Provider value={{ session: session }}>
      <Component {...pageProps} />
    </AppContext.Provider>
  )
}

export default MyApp
