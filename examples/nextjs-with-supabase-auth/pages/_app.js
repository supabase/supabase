import { UserProvider } from '@supabase/supabase-auth-helpers/react'
import { supabaseClient } from '@supabase/supabase-auth-helpers/nextjs'
import './../style.css'

export default function MyApp({ Component, pageProps }) {
  return (
    <main className={'dark'}>
      <UserProvider supabaseClient={supabaseClient}>
        <Component {...pageProps} />
      </UserProvider>
    </main>
  )
}
