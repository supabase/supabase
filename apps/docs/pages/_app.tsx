import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { AuthProvider, ThemeProvider } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AppPropsWithLayout } from 'types'
import { CommandMenuProvider } from 'ui'
import components from '~/components'
import Favicons from '~/components/Favicons'
import SiteLayout from '~/layouts/SiteLayout'
import { IS_PLATFORM, LOCAL_SUPABASE } from '~/lib/constants'
import { post } from '~/lib/fetchWrappers'
import '../styles/ch.scss'
import '../styles/main.scss?v=1.0.0'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter()

  const [supabase] = useState(() =>
    IS_PLATFORM || LOCAL_SUPABASE ? createBrowserSupabaseClient() : undefined
  )

  function handlePageTelemetry(route: string) {
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
      handlePageTelemetry(url)
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

  useEffect(() => {
    /**
     * Send page telemetry on first page load
     */
    if (router.isReady) {
      handlePageTelemetry(router.asPath)
    }
  }, [router.isReady])

  const SITE_TITLE = 'Supabase Documentation'

  const AuthContainer = (props) => {
    return IS_PLATFORM || LOCAL_SUPABASE ? (
      <SessionContextProvider supabaseClient={supabase}>
        <AuthProvider>{props.children}</AuthProvider>
      </SessionContextProvider>
    ) : (
      <AuthProvider>{props.children}</AuthProvider>
    )
  }

  return (
    <>
      <Favicons />
      <AuthContainer>
        <ThemeProvider>
          <CommandMenuProvider
            site="docs"
            MarkdownHandler={(props) => (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} {...props} />
            )}
          >
            <SiteLayout>
              <Component {...pageProps} />
            </SiteLayout>
          </CommandMenuProvider>
        </ThemeProvider>
      </AuthContainer>
    </>
  )
}

export default MyApp
