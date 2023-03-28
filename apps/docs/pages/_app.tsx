import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { ThemeProvider } from 'common/Providers'
import { DefaultSeo } from 'next-seo'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { AppPropsWithLayout } from 'types'
import Favicons from '~/components/Favicons'
import SearchProvider from '~/components/Search/SearchProvider'
import SiteLayout from '~/layouts/SiteLayout'
import { IS_PLATFORM, LOCAL_SUPABASE } from '~/lib/constants'
import { post } from '~/lib/fetchWrappers'
import '../styles/algolia-search.scss'
import '../styles/ch.scss'
import '../styles/docsearch.scss'
import '../styles/main.scss?v=1.0.0'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter()

  const [supabase] = useState(() =>
    IS_PLATFORM || LOCAL_SUPABASE ? createBrowserSupabaseClient() : undefined
  )

  function telemetry(route: string) {
    return post(`https://api.supabase.io/platform/telemetry/page`, {
      referrer: document.referrer,
      title: document.title,
      route,
    })
  }

  useEffect(() => {
    function handleRouteChange(url: string) {
      /*
       * handle telemetry
       */
      telemetry(url)
      /*
       * handle "scroll to top" behaviour on route change
       */
      if (document) {
        // do not scroll to top for reference docs
        if (!url.includes('reference/')) {
          // scroll container div to top
          const container = document.getElementById('docs-content-container')
          // check container exists (only avail on new docs)
          if (container) container.scrollTop = 0
        }
      }
    }

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  const SITE_TITLE = 'Supabase Documentation'

  return (
    <>
      <Favicons />
      {IS_PLATFORM || LOCAL_SUPABASE ? (
        <SessionContextProvider supabaseClient={supabase}>
          <ThemeProvider>
            <SearchProvider>
              <SiteLayout>
                <Component {...pageProps} />
              </SiteLayout>
            </SearchProvider>
          </ThemeProvider>
        </SessionContextProvider>
      ) : (
        <ThemeProvider>
          <SearchProvider>
            <SiteLayout>
              <Component {...pageProps} />
            </SiteLayout>
          </SearchProvider>
        </ThemeProvider>
      )}
    </>
  )
}

export default MyApp
