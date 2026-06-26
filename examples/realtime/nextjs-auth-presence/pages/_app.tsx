import { SupabaseProvider, useSupabaseClient } from '@/lib/supabase-context'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import '../styles/globals.css'

function MyAppInner({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const supabase = useSupabaseClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
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
  }, [supabase, router])

  return <Component {...pageProps} />
}

function MyApp(props: AppProps) {
  return (
    <SupabaseProvider>
      <MyAppInner {...props} />
    </SupabaseProvider>
  )
}

export default MyApp
