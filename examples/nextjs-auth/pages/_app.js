import { UserContextProvider } from '../lib/UserContext'
import { supabase } from '../utils/initSupabase'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }) {
  return (
    <main>
      <UserContextProvider supabaseClient={supabase}>
        <Component {...pageProps} />
      </UserContextProvider>
    </main>
  )
}
