import { post } from 'lib/fetchWrappers'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { AppPropsWithLayout } from 'types'
import { SearchProvider } from '~/components/DocSearch'
import { ThemeProvider } from '../components/Providers'
import '../styles/algolia-search.scss'
import '../styles/ch.scss'
import '../styles/docsearch.scss'
import '../styles/main.scss?v=1.0.0'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import SiteLayout from '~/layouts/SiteLayout'

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
      telemetry(url)
    }

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  const getLayout = Component.getLayout || ((page) => page)

  return (
    <ThemeProvider>
      <SearchProvider>
        <SiteLayout>{getLayout(<Component {...pageProps}></Component>)}</SiteLayout>
      </SearchProvider>
    </ThemeProvider>
  )
}

export default MyApp
