import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/main.scss'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClient } from '@supabase/supabase-js'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { AuthProvider, ThemeProvider, useTelemetryProps, useThemeSandbox } from 'common'
import { useRouter } from 'next/router'
import { type PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { AppPropsWithLayout } from 'types'
import { CommandMenuProvider, PortalToast, useConsent } from 'ui'
import { TabsProvider } from 'ui/src/components/Tabs'
import Favicons from '~/components/Favicons'
import { IPv4DeprecationBanner } from '~/components/IPv4DeprecationBanner'
import SiteLayout from '~/layouts/SiteLayout'
import { IS_PLATFORM } from '~/lib/constants'
import { unauthedAllowedPost } from '~/lib/fetch/fetchWrappers'
import { useRootQueryClient } from '~/lib/fetch/queryClient'
import { useOnLogout } from '~/lib/userAuth'
import { LOCAL_STORAGE_KEYS, remove } from '~/lib/storage'

/**
 *
 * !!! IMPORTANT !!!
 * Ensure data is cleared on sign out.
 *
 * **/
function SignOutHandler({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()

  const cleanUp = useCallback(() => {
    queryClient.cancelQueries()
    queryClient.clear()

    Object.keys(LOCAL_STORAGE_KEYS).forEach((key) => {
      remove('local', LOCAL_STORAGE_KEYS[key])
    })
  }, [queryClient])

  useOnLogout(cleanUp)

  return <>{children}</>
}

function AuthContainer({ children }: PropsWithChildren) {
  const [supabase] = useState(() =>
    IS_PLATFORM
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
      : undefined
  )

  return IS_PLATFORM ? (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthProvider>{children}</AuthProvider>
    </SessionContextProvider>
  ) : (
    <AuthProvider>{children}</AuthProvider>
  )
}

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()
  const { consentValue, hasAcceptedConsent } = useConsent()
  const queryClient = useRootQueryClient()

  useThemeSandbox()

  const handlePageTelemetry = useCallback(
    (route: string) => {
      if (IS_PLATFORM) {
        unauthedAllowedPost('/platform/telemetry/page', {
          body: {
            referrer: document.referrer,
            title: document.title,
            route,
            ga: {
              screen_resolution: telemetryProps?.screenResolution,
              language: telemetryProps?.language,
              session_id: '',
            },
          },
        }).catch((e) => {
          console.error('Problem sending telemetry:', e)
        })
      }
    },
    [telemetryProps]
  )

  useEffect(() => {
    function handleRouteChange(url: string) {
      /*
       * handle telemetry
       */
      if (hasAcceptedConsent) handlePageTelemetry(url)
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
  }, [router, handlePageTelemetry, consentValue, hasAcceptedConsent])

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
    if (!hasAcceptedConsent) return

    /**
     * Send page telemetry on first page load
     */
    if (router.isReady) {
      handlePageTelemetry(router.basePath + router.asPath)
    }
  }, [router, handlePageTelemetry, consentValue, hasAcceptedConsent])

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

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Favicons />
        <AuthContainer>
          <SignOutHandler>
            <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
              <CommandMenuProvider site="docs">
                <TabsProvider>
                  <div className="h-screen flex flex-col">
                    <IPv4DeprecationBanner />
                    <SiteLayout>
                      <PortalToast />
                      <Component {...pageProps} />
                    </SiteLayout>
                  </div>
                </TabsProvider>
              </CommandMenuProvider>
            </ThemeProvider>
          </SignOutHandler>
        </AuthContainer>
      </QueryClientProvider>
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
