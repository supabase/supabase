import '../../../packages/ui/build/css/themes/light.css'
import '../../../packages/ui/build/css/themes/dark.css'

import '../styles/index.css'

import { API_URL, APP_NAME, DEFAULT_META_DESCRIPTION } from 'lib/constants'
import { DefaultSeo } from 'next-seo'
import { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Meta from '~/components/Favicons'
import '../styles/index.css'
import { post } from '~/lib/fetchWrapper'
import { AuthProvider, ThemeProvider, useTelemetryProps } from 'common'
import Head from 'next/head'
import 'config/code-hike.scss'

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

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
    function handleRouteChange(url: string) {
      handlePageTelemetry(url)
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

  const site_title = `${APP_NAME} | The Open Source Firebase Alternative`
  const { basePath } = useRouter()

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
          url: 'https://iechor.com/',
          site_name: 'iEchor',
          images: [
            {
              url: `https://iechor.com${basePath}/images/og/og-image-v2.jpg`,
              width: 800,
              height: 600,
              alt: 'iEchor Og Image',
            },
          ],
        }}
        twitter={{
          handle: '@supabase',
          site: '@supabase',
          cardType: 'summary_large_image',
        }}
      />
      <AuthProvider>
        <ThemeProvider detectSystemColorPreference={false}>
          <Component {...pageProps} />
        </ThemeProvider>
      </AuthProvider>
    </>
  )
}
