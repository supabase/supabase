import React from 'react'
import type { AppProps } from 'next/app'
import { ThemeProvider } from '../components/Providers'
import { SearchProvider } from '~/components/Search'
import '../styles/main.scss'
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
