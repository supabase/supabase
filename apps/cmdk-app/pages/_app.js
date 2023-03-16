import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import '../styles/globals.css'
import { ThemeProvider, useTheme } from 'common/Providers'

function MyApp({ Component, pageProps }) {
  const [supabase] = useState(() => createBrowserSupabaseClient())

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionContextProvider>
  )
}

export default MyApp
