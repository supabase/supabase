import React from 'react'
import type { AppProps } from 'next/app'
import { ThemeProvider } from '../components/Providers'
import { SearchProvider } from '~/components/DocSearch'
import '../styles/main.scss?v=1.0.0'
import '../styles/docsearch.scss'
import '../styles/algolia-search.scss'
import '../styles/prism-okaidia.scss'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <SearchProvider>
        <Component {...pageProps} />
      </SearchProvider>
    </ThemeProvider>
  )
}

export default MyApp
