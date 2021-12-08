import 'styles/main.scss'
import 'styles/editor.scss'
import 'styles/ui.scss'
import 'styles/storage.scss'
import 'styles/stripe.scss'
import 'styles/toast.scss'
import 'styles/code.scss'
import 'styles/monaco.scss'
import 'styles/contextMenu.scss'

import Head from 'next/head'
import dynamic from 'next/dynamic'
import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import { RootStore } from 'stores'
import { StoreProvider } from 'hooks'
import PageTelemetry from 'components/ui/PageTelemetry'
import FlagProvider from 'components/ui/Flag/FlagProvider'
import { useState } from 'react'

const PortalRootWithNoSSR = dynamic(
  // @ts-ignore
  () => import('@radix-ui/react-portal').then((portal) => portal.Root),
  { ssr: false }
)

const PortalToast = () => (
  // @ts-ignore
  <PortalRootWithNoSSR className="portal--toast">
    <Toaster
      position="top-right"
      toastOptions={{
        className:
          'bg-bg-primary-light dark:bg-bg-primary-dark text-typography-body-strong-light dark:text-typography-body-strong-dark border dark:border-dark',
        style: {
          padding: '8px',
          paddingLeft: '16px',
          paddingRight: '16px',
          fontSize: '0.875rem',
        },
        error: {
          duration: 8000,
        },
      }}
    />
  </PortalRootWithNoSSR>
)

function MyApp({ Component, pageProps }: AppProps) {
  const [rootStore] = useState(() => new RootStore())

  return (
    <StoreProvider rootStore={rootStore}>
      <FlagProvider>
        <Head>
          <title>Supabase</title>
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
          <link rel="stylesheet" type="text/css" href="/css/fonts.css" />
        </Head>
        <PageTelemetry>
          <Component {...pageProps} />
        </PageTelemetry>
        <PortalToast />
      </FlagProvider>
    </StoreProvider>
  )
}
export default MyApp
