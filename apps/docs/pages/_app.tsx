import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/main.scss'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClient } from '@supabase/supabase-js'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { AuthProvider, ThemeProvider, useTelemetryProps, useThemeSandbox } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState, type PropsWithChildren } from 'react'
import { PortalToast, PromoToast, TabsProvider } from 'ui'
import { CommandMenuProvider } from 'ui-patterns/Cmdk'
import { useConsent } from 'ui-patterns/ConsentToast'

import MetaFaviconsPagesRouter from 'common/MetaFavicons/pages-router'
import SiteLayout from '~/layouts/SiteLayout'
import { BUILD_PREVIEW_HTML, IS_PLATFORM, IS_PREVIEW } from '~/lib/constants'
import { unauthedAllowedPost } from '~/lib/fetch/fetchWrappers'
import { useRootQueryClient } from '~/lib/fetch/queryClient'
import { LOCAL_STORAGE_KEYS, remove } from '~/lib/storage'
import { useOnLogout } from '~/lib/userAuth'
import { AppPropsWithLayout } from '~/types'

/**
 * Preview builds don't need to be statically generated to optimize performance.
 * This (somewhat hacky) way of shortcutting preview builds cuts their build
 * time and speeds up the feedback loop for previewing docs changes in Vercel.
 *
 * This technically breaks the Rules of Hooks to avoid an unnecessary full-app
 * rerender in prod, but this is fine because IS_PREVIEW will never change on
 * you within a single build.
 */
function ShortcutPreviewBuild({ children }: PropsWithChildren) {
  if (IS_PREVIEW && !BUILD_PREVIEW_HTML) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isMounted, setIsMounted] = useState(false)

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      setIsMounted(true)
    }, [])

    return isMounted ? children : null
  }

  return children
}

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
    <ShortcutPreviewBuild>
      <QueryClientProvider client={queryClient}>
        <MetaFaviconsPagesRouter applicationName="Supabase Docs" />
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <AuthContainer>
          <SignOutHandler>
            <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
              <CommandMenuProvider site="docs">
                <TabsProvider>
                  <div className="h-screen flex flex-col">
                    <SiteLayout>
                      <PortalToast />
                      <PromoToast />
                      <Component {...pageProps} />
                    </SiteLayout>
                  </div>
                </TabsProvider>
              </CommandMenuProvider>
            </ThemeProvider>
          </SignOutHandler>
        </AuthContainer>
      </QueryClientProvider>
    </ShortcutPreviewBuild>
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
