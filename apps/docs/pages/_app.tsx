import '../../../packages/ui/build/css/themes/dark.css'
import '../../../packages/ui/build/css/themes/light.css'

import 'config/code-hike.scss'
import '../styles/main.scss?v=1.0.0'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { AuthProvider, ThemeProvider, useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { AppPropsWithLayout } from 'types'
import { CommandMenuProvider } from 'ui'
import { TabsProvider } from 'ui/src/components/Tabs'
import Favicons from '~/components/Favicons'
import SiteLayout from '~/layouts/SiteLayout'
import { API_URL, IS_PLATFORM, LOCAL_IECHOR } from '~/lib/constants'
import { post } from '~/lib/fetchWrappers'

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  const [supabase] = useState(() =>
    IS_PLATFORM || LOCAL_IECHOR ? createBrowserSupabaseClient() : undefined
  )

  const handlePageTelemetry = useCallback(
    (route: string) => {
      return post(`${API_URL}/telemetry/page`, {
        referrer: document.referrer,
        title: document.title,
        route,
        ga: {
          screen_resolution: telemetryProps?.screenResolution,
          language: telemetryProps?.language,
        },
      })
    },
    [telemetryProps]
  )

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
  }, [router, handlePageTelemetry])

  /**
   * Save/restore scroll position when reloading or navigating back/forward.
   *
   * Required since scroll happens within a sub-container, not the page root.
   */
  useEffect(() => {
    const storageKey = 'scroll-position'

    const container = document.getElementById('docs-content-container')
    if (!container) {
      return
    }

    const previousScroll = Number(sessionStorage.getItem(storageKey))
    const [entry] = window.performance.getEntriesByType('navigation')

    // Only restore scroll position on reload and back/forward events
    if (
      previousScroll &&
      entry &&
      isPerformanceNavigationTiming(entry) &&
      ['reload', 'back_forward'].includes(entry.type)
    ) {
      container.scrollTop = previousScroll
    }

    const handler = () => {
      // Scroll stored in session storage, so only persisted per tab
      sessionStorage.setItem(storageKey, container.scrollTop.toString())
    }

    window.addEventListener('beforeunload', handler)

    return () => window.removeEventListener('beforeunload', handler)
  }, [router])

  useEffect(() => {
    /**
     * Send page telemetry on first page load
     */
    if (router.isReady) {
      handlePageTelemetry(router.basePath + router.asPath)
    }
  }, [router, handlePageTelemetry])

  /**
   * Reference docs use `history.pushState()` to jump to
   * sub-sections without causing a re-render.
   *
   * We need to the below handler to manually force a re-render
   * when navigating away from, then back to reference docs
   */
  useEffect(() => {
    function handler() {
      router.replace(window.location.href)
    }

    window.addEventListener('popstate', handler)

    return () => {
      window.removeEventListener('popstate', handler)
    }
  }, [router])

  const SITE_TITLE = 'iEchor Documentation'

  const AuthContainer = (props) => {
    return IS_PLATFORM || LOCAL_IECHOR ? (
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
          <CommandMenuProvider site="docs">
            <TabsProvider>
              <SiteLayout>
                <Component {...pageProps} />
              </SiteLayout>
            </TabsProvider>
          </CommandMenuProvider>
        </ThemeProvider>
      </AuthContainer>
    </>
  )
}

/**
 * Type guard that checks if a performance entry is a
 * `PerformanceNavigationTiming`.
 */
function isPerformanceNavigationTiming(
  entry: PerformanceEntry
): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation'
}

export default MyApp
