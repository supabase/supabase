'use client'

import React, { useEffect } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { AuthProvider, ThemeProvider, useTelemetryProps, useThemeSandbox } from 'common'
import { CommandMenuProvider, PortalToast, themes } from 'ui'
import { useConsent } from 'ui-patterns/ConsentToast'

import { API_URL } from '~/lib/constants'
import { post } from '~/lib/fetchWrapper'
import supabase from '~/lib/supabase'

function Providers({ children }: any) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const telemetryProps = useTelemetryProps()
  const { consentValue, hasAcceptedConsent } = useConsent()

  useThemeSandbox()

  function handlePageTelemetry(route: string) {
    return post(`${API_URL}/telemetry/page`, {
      referrer: document.referrer,
      title: document.title,
      route,
      ga: {
        screen_resolution: telemetryProps?.screenResolution,
        language: telemetryProps?.language,
      },
    })
  }

  useEffect(() => {
    if (!hasAcceptedConsent) return

    function handleRouteChange(url: string) {
      handlePageTelemetry(url)
    }

    // Listen for page changes after a navigation or when the query changes
    handleRouteChange(pathname!)
  }, [pathname, consentValue])

  useEffect(() => {
    if (!hasAcceptedConsent) return
    /**
     * Send page telemetry on first page load
     */
    if (searchParams) {
      handlePageTelemetry(pathname!)
    }
  }, [searchParams, consentValue, pathname])

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
