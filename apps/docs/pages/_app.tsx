import { useEffect } from 'react'
import { useRouter } from 'next/router'
import type { AppProps } from 'next/app'
import { post } from 'lib/fetchWrappers'
import { ThemeProvider } from '../components/Providers'
import { SearchProvider } from '~/components/DocSearch'
import { DefaultSeo } from 'next-seo'
import Favicons from '~/components/Favicons'
import '../styles/main.scss?v=1.0.0'
import '../styles/docsearch.scss'
import '../styles/algolia-search.scss'
import '../styles/prism-okaidia.scss'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  function telemetry(route: string) {
    return post(`https://api.supabase.io/platform/telemetry/page`, {
      referrer: document.referrer,
      title: document.title,
      route,
    })
  }

  useEffect(() => {
    function handleRouteChange(url: string) {
      telemetry(url)
    }

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  const SITE_TITLE = 'Supabase Documentation'
  const SITE_DESCRIPTION = 'The open source Firebase alternative.'
  const { basePath } = useRouter()

  return (
    <>
      <Favicons />
      <DefaultSeo
        title={SITE_TITLE}
        description={SITE_DESCRIPTION}
        openGraph={{
          type: 'website',
          url: 'https://supabase.com/docs',
          site_name: SITE_TITLE,
          images: [
            {
              url: `https://supabase.com${basePath}/img/supabase-og-image.png`,
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
      <ThemeProvider>
        <SearchProvider>
          <Component {...pageProps} />
        </SearchProvider>
      </ThemeProvider>
    </>
  )
}

export default MyApp
