'use client'

import React from 'react'

import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { AuthProvider, ThemeProvider, useThemeSandbox } from 'common'
import { DefaultSeo } from 'next-seo'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { CommandMenuProvider, PortalToast, themes } from 'ui'
// import { useConsent } from 'ui-patterns/ConsentToast'

import Meta from '~/components/Favicons'
import { API_URL, APP_NAME, DEFAULT_META_DESCRIPTION } from '~/lib/constants'
import { post } from '~/lib/fetchWrapper'
import supabase from '~/lib/supabase'

function Providers({ children }: any) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // const telemetryProps = useTelemetryProps()
  // const { consentValue, hasAcceptedConsent } = useConsent()

  useThemeSandbox()

  // function handlePageTelemetry(route: string) {
  //   return post(`${API_URL}/telemetry/page`, {
  //     referrer: document.referrer,
  //     title: document.title,
  //     route,
  //     ga: {
  //       screen_resolution: telemetryProps?.screenResolution,
  //       language: telemetryProps?.language,
  //     },
  //   })
  // }

  // useEffect(() => {
  //   if (!hasAcceptedConsent) return

  //   function handleRouteChange(url: string) {
  //     handlePageTelemetry(url)
  //   }

  //   // Listen for page changes after a navigation or when the query changes
  //   router.events.on('routeChangeComplete', handleRouteChange)
  //   return () => {
  //     router.events.off('routeChangeComplete', handleRouteChange)
  //   }
  // }, [router.events, consentValue])

  // useEffect(() => {
  //   if (!hasAcceptedConsent) return
  //   /**
  //    * Send page telemetry on first page load
  //    */
  //   if (searchParams) {
  //     handlePageTelemetry(pathname!)
  //   }
  // }, [searchParams, consentValue, pathname])

  const site_title = `${APP_NAME} | The Open Source Firebase Alternative`
  // const { basePath, pathname } = useRouter()

  const forceDarkMode = pathname === '/' || pathname?.startsWith('/launch-week')

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthProvider>
        <ThemeProvider
          themes={themes.map((theme) => theme.value)}
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          forcedTheme={forceDarkMode ? 'dark' : undefined}
        >
          <CommandMenuProvider site="website">
            <PortalToast />
            {children}
          </CommandMenuProvider>
        </ThemeProvider>
      </AuthProvider>
    </SessionContextProvider>
  )
}

export default Providers
