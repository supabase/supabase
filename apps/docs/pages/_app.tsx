import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/main.scss'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import MetaFaviconsPagesRouter from 'common/MetaFavicons/pages-router'
import Head from 'next/head'

import type { AppPropsWithLayout } from '~/types'
import { GlobalProviders } from '~/features/app.providers'

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  return (
    <>
      <MetaFaviconsPagesRouter applicationName="Supabase Docs" />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Supabase Docs</title>
      </Head>
      <GlobalProviders>
        <Component {...pageProps} />
      </GlobalProviders>
    </>
  )
}

export default MyApp
