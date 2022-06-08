import React from 'react'
import type { AppProps } from 'next/app'
import { ThemeProvider } from '../components/Providers'
import '../styles/main.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
