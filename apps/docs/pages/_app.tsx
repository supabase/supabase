import { DefaultSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { AppPropsWithLayout } from 'types'
import { SearchProvider } from '~/components/DocSearch'
import Favicons from '~/components/Favicons'
import { ThemeProvider } from 'common/Providers'
import SiteLayout from '~/layouts/SiteLayout'
import '../styles/algolia-search.scss'
import '../styles/ch.scss'
import '../styles/docsearch.scss'
import '../styles/main.scss?v=1.0.0'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'
import { post } from '~/lib/fetchWrappers'

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
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
      /*
       * handle telemetry
       */
      telemetry(url)
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
          <SiteLayout>
            <Component {...pageProps} />
          </SiteLayout>
        </SearchProvider>
      </ThemeProvider>
    </>
  )
}

export default MyApp
