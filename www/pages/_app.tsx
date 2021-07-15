import { APP_NAME, DESCRIPTION } from 'lib/constants'
import { DefaultSeo } from 'next-seo'
import { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Meta from '~/components/Favicons'
import '../styles/index.css'
import { post } from './../lib/fetchWrapper'

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  function telemetry() {
    return post(`https://app.supabase.io/api/telemetry/page`, {
      referrer: document.referrer,
      title: document.title,
    })
  }

  useEffect(() => {
    // `routeChangeComplete` won't run for the first page load unless the query string is
    // hydrated later on, so here we log a page view if this is the first render and
    // there's no query string
    if (!router.asPath.includes('?')) {
      telemetry()
    }
  }, [])

  useEffect(() => {
    function handleRouteChange() {
      telemetry()
    }

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  const site_title = `The Open Source Firebase Alternative | ${APP_NAME}`
  const { basePath } = useRouter()

  return (
    <>
      <Meta />
      <DefaultSeo
        title={site_title}
        description={DESCRIPTION}
        openGraph={{
          type: 'website',
          url: 'https://supabase.io/',
          site_name: 'Supabase',
          images: [
            {
              url: `https://supabase.io${basePath}/images/og/og-image.jpg`,
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
      <Component {...pageProps} />
    </>
  )
}
