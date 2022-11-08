import { useEffect } from 'react'
import { useRouter } from 'next/router'
import type { AppProps } from 'next/app'
import { post } from 'lib/fetchWrappers'
import { ThemeProvider } from '../components/Providers'
import { SearchProvider } from '~/components/DocSearch'
import '../styles/main.scss?v=1.0.0'
import '../styles/docsearch.scss'
import '../styles/algolia-search.scss'
import '../styles/prism-okaidia.scss'
import '@code-hike/mdx/dist/index.css'

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

  return (
    <ThemeProvider>
      <SearchProvider>
        <Component {...pageProps} />
      </SearchProvider>
    </ThemeProvider>
  )
}

export default MyApp
