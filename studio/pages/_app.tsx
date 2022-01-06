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
import { useRouter } from 'next/router'
import { FC, useEffect, useState } from 'react'
import { Subscription } from '@supabase/gotrue-js'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { Button, IconX } from '@supabase/ui'
import { RootStore } from 'stores'
import { StoreProvider } from 'hooks'
import { getParameterByName } from 'lib/common/fetch'
import { GOTRUE_ERRORS } from 'lib/constants'
import { auth } from 'lib/gotrue'
import PageTelemetry from 'components/ui/PageTelemetry'
import FlagProvider from 'components/ui/Flag/FlagProvider'
import Connecting from 'components/ui/Loading'

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

function doesTokenDataExist() {
  // ignore if server-side
  if (typeof window === 'undefined') return false
  // check tokenData on localstorage
  const tokenData = window?.localStorage['supabase.auth.token']
  return tokenData != undefined && typeof tokenData === 'string'
}

/**
 * On app first load, gotrue client may take a while to refresh access token
 * We have to wait for that process to complete before showing children components
 */
const GotrueWrapper: FC = ({ children }) => {
  const [loading, setLoading] = useState(doesTokenDataExist())

  useEffect(() => {
    let subscription: Subscription | null
    let timer: any
    const currentSession = auth.session()

    function tokenRefreshed() {
      setLoading(false)
      // clean subscription
      if (subscription) subscription.unsubscribe()
      // clean timer
      if (timer) clearTimeout(timer)
    }

    if (currentSession != undefined && currentSession != null) {
      // if there is an active session, go ahead
      setLoading(false)
    } else {
      // else wait for TOKEN_REFRESHED event before continue
      const response = auth.onAuthStateChange((_event, session) => {
        if (loading && _event === 'TOKEN_REFRESHED') {
          tokenRefreshed()
        }
      })
      subscription = response.data ?? null

      // we need a timeout here, in case token refresh fails
      timer = setTimeout(() => setLoading(false), 5 * 1000)
    }

    return () => {
      if (subscription) subscription.unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [])

  return <>{loading ? <Connecting /> : children}</>
}

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
        <GotrueWrapper>
          <PageTelemetry>
            <Component {...pageProps} />
          </PageTelemetry>
        </GotrueWrapper>
        <PortalToast />
      </FlagProvider>
    </StoreProvider>
  )
}
export default MyApp
