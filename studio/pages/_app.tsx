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
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { Button, IconX } from '@supabase/ui'

import { RootStore } from 'stores'
import { StoreProvider } from 'hooks'
import { getParameterByName } from 'lib/common/fetch'
import { GOTRUE_ERRORS } from 'lib/constants'
import PageTelemetry from 'components/ui/PageTelemetry'
import FlagProvider from 'components/ui/Flag/FlagProvider'

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
    >
      {(t) => (
        <ToastBar toast={t} style={t.style}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              {t.type !== 'loading' && (
                <div className="ml-4">
                  <Button className="!p-1" type="text" onClick={() => toast.dismiss(t.id)}>
                    <IconX size={14} strokeWidth={2} />
                  </Button>
                </div>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  </PortalRootWithNoSSR>
)

function MyApp({ Component, pageProps }: AppProps) {
  const [rootStore] = useState(() => new RootStore())
  const router = useRouter()

  useEffect(() => {
    const errorDescription = getParameterByName('error_description', router.asPath)
    if (errorDescription === GOTRUE_ERRORS.UNVERIFIED_GITHUB_USER) {
      rootStore.ui.setNotification({
        category: 'error',
        message:
          'Please verify your email on Github first, then reach out to us at support@supabase.io to log into the dashboard',
      })
    }
  }, [])

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
