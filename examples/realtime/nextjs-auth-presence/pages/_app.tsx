import { createBrowserSupabaseClient, Session } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import '../styles/globals.css'

function MyApp({
  Component,
  pageProps,
}: AppProps<{
  initialSession: Session
}>) {
  const router = useRouter()
  const [supabaseClient] = useState(() => createBrowserSupabaseClient())

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'SIGNED_IN':
          router.push('/')
          return
        case 'SIGNED_OUT':
          router.push('/login')
          return
      }
    })
    return subscription.unsubscribe
  }, [])

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <Component {...pageProps} />
    </SessionContextProvider>
  )
}

export default MyApp
