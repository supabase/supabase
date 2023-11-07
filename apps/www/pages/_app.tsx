import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../../../packages/ui/build/css/themes/dark.css'
import '../../../packages/ui/build/css/themes/light.css'
import '../styles/index.css'

import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { AuthProvider, ThemeProvider, useTelemetryProps, useThemeSandbox } from 'common'
import { API_URL, APP_NAME, DEFAULT_META_DESCRIPTION } from 'lib/constants'
import { DefaultSeo } from 'next-seo'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { CommandMenuProvider, PortalToast, useConsent } from 'ui'
import Meta from '~/components/Favicons'
import { post } from '~/lib/fetchWrapper'
import supabase from '~/lib/supabase'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
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
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events, consentValue])

  useEffect(() => {
    if (!hasAcceptedConsent) return
    /**
     * Send page telemetry on first page load
     */
    if (router.isReady) {
      handlePageTelemetry(router.asPath)
    }
  }, [router.isReady, consentValue])

  const site_title = `${APP_NAME} | The Open Source Firebase Alternative`
  const { basePath, pathname } = useRouter()

  const forceDarkMode = pathname === '/' || router.pathname.startsWith('/launch-week')

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Meta />
      <DefaultSeo
        title={site_title}
        description={DEFAULT_META_DESCRIPTION}
        openGraph={{
          type: 'website',
          url: 'https://supabase.com/',
          site_name: 'Supabase',
          images: [
            {
              url: `https://supabase.com${basePath}/images/og/og-image-v2.jpg`,
              width: 800,
              height: 600,
              alt: 'Supabase Og Image',
            },
          ],
        }}
        twitter={{
          handle: '@supabase',
          site: '@supabase',
          cardType: 'summary_large_image',
        }}
      />
      <SessionContextProvider supabaseClient={supabase}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            forcedTheme={forceDarkMode ? 'dark' : undefined}
          >
            <CommandMenuProvider site="website">
              <PortalToast />
              <Component {...pageProps} />
            </CommandMenuProvider>
          </ThemeProvider>
        </AuthProvider>
      </SessionContextProvider>
    </>
  )
}
