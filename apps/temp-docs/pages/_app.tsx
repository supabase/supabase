import React from 'react'
import type { AppProps } from 'next/app'
import { ThemeProvider } from '../components/Providers'
import '../styles/main.scss'
import '../styles/algolia-search.scss'
import '../styles/prism-okaidia.scss'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
