import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/index.css'

import { SessionContextProvider } from '@supabase/auth-helpers-react'
import {
  AuthProvider,
  IS_PROD,
  isBrowser,
  ThemeProvider,
  useTelemetryProps,
  useThemeSandbox,
} from 'common'
import { DefaultSeo } from 'next-seo'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Announcement, SonnerToaster, themes } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'
import { useConsent } from 'ui-patterns/ConsentToast'

import MetaFaviconsPagesRouter, {
  DEFAULT_FAVICON_ROUTE,
  DEFAULT_FAVICON_THEME_COLOR,
} from 'common/MetaFavicons/pages-router'
import { WwwCommandMenu } from '~/components/CommandMenu'
import { API_URL, APP_NAME, DEFAULT_META_DESCRIPTION, IS_PREVIEW } from '~/lib/constants'
import { post } from '~/lib/fetchWrapper'
import supabase from '~/lib/supabase'
import useDarkLaunchWeeks from '../hooks/useDarkLaunchWeeks'
import LW13CountdownBanner from 'ui/src/layout/banners/LW13CountdownBanner/LW13CountdownBanner'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()
  const { consentValue, hasAcceptedConsent } = useConsent()
  const IS_DEV = !IS_PROD && !IS_PREVIEW
  const blockEvents = IS_DEV || !hasAcceptedConsent

  const title = typeof document !== 'undefined' ? document?.title : ''
  const referrer = typeof document !== 'undefined' ? document?.referrer : ''

  const { search, language, viewport_height, viewport_width } = telemetryProps

  useThemeSandbox()

  function handlePageTelemetry(url: string) {
    return post(
      `${API_URL}/telemetry/page`,
      {
        page_url: url,
        page_title: title,
        pathname: router.pathname,
        ph: {
          referrer,
          language,
          search,
          viewport_height,
          viewport_width,
          user_agent: navigator.userAgent,
        },
      },
      { headers: { Version: '2' }, credentials: 'include' }
    )
  }

  useEffect(() => {
    if (blockEvents) return

    function handleRouteChange() {
      handlePageTelemetry(window.location.href)
    }

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events, consentValue])

  useEffect(() => {
    if (blockEvents) return
    /**
     * Send page telemetry on first page load
     */
    if (router.isReady) {
      handlePageTelemetry(window.location.href)
    }
  }, [router.isReady, consentValue])

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!blockEvents) {
        await post(`${API_URL}/telemetry/page-leave`, {
          page_url: window.location.href,
          page_title: title,
          pathname: router.pathname,
        })
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [blockEvents, router.pathname, title])

  const site_title = `${APP_NAME} | The Open Source Firebase Alternative`
  const { basePath } = useRouter()

  const isDarkLaunchWeek = useDarkLaunchWeeks()
  const forceDarkMode = isDarkLaunchWeek

  let applicationName = 'Supabase'
  let faviconRoute = DEFAULT_FAVICON_ROUTE
  let themeColor = DEFAULT_FAVICON_THEME_COLOR

  if (router.asPath && router.asPath.includes('/launch-week/x')) {
    applicationName = 'Supabase LWX'
    faviconRoute = 'images/launchweek/lwx/favicon'
    themeColor = 'FFFFFF'
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <MetaFaviconsPagesRouter
        applicationName={applicationName}
        route={faviconRoute}
        themeColor={themeColor}
        includeManifest
        includeMsApplicationConfig
        includeRssXmlFeed
      />
      <DefaultSeo
        title={site_title}
        description={DEFAULT_META_DESCRIPTION}
        openGraph={{
          type: 'website',
          url: 'https://supabase.com/',
          site_name: 'Supabase',
          images: [
            {
              url: `https://supabase.com${basePath}/images/og/supabase-og.png`,
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
            themes={themes.map((theme) => theme.value)}
            enableSystem
            disableTransitionOnChange
            forcedTheme={forceDarkMode ? 'dark' : undefined}
          >
            <CommandProvider>
              <Announcement>
                <LW13CountdownBanner />
              </Announcement>
              <SonnerToaster position="top-right" />
              <Component {...pageProps} />
              <WwwCommandMenu />
            </CommandProvider>
          </ThemeProvider>
        </AuthProvider>
      </SessionContextProvider>
    </>
  )
}
