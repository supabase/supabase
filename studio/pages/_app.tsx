import 'styles/main.scss'
import 'styles/editor.scss'
import 'styles/ui.scss'
import 'styles/storage.scss'
import 'styles/stripe.scss'
import 'styles/toast.scss'
import 'styles/code.scss'
import 'styles/monaco.scss'
import 'styles/contextMenu.scss'
import 'styles/react-data-grid-logs.scss'
import 'styles/date-picker.scss'
import 'styles/grid.scss'
import 'styles/graphiql-base.scss'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import relativeTime from 'dayjs/plugin/relativeTime'

// @ts-ignore
import Prism from 'prism-react-renderer/prism'

import Head from 'next/head'
import Script from 'next/script'

import { AppPropsWithLayout } from 'types'

import { useEffect, useState } from 'react'
import { Hydrate, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RootStore } from 'stores'
import HCaptchaLoadedStore from 'stores/hcaptcha-loaded-store'
import { StoreProvider } from 'hooks'
import { AuthProvider } from 'lib/auth'
import { dart } from 'lib/constants/prism'
import { useRootQueryClient } from 'data/query-client'

import { PortalToast, RouteValidationWrapper, AppBannerWrapper } from 'components/interfaces/App'
import PageTelemetry from 'components/ui/PageTelemetry'
import FlagProvider from 'components/ui/Flag/FlagProvider'
import useAutoAuthRedirect from 'hooks/misc/useAutoAuthRedirect'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

dart(Prism)

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const queryClient = useRootQueryClient()
  const [rootStore] = useState(() => new RootStore())

  const getSavingState = () => rootStore.content.savingState

  // prompt the user if they try and leave with unsaved content store changes
  useEffect(() => {
    const warningText = 'You have unsaved changes - are you sure you wish to leave this page?'

    const handleWindowClose = (e: BeforeUnloadEvent) => {
      const savingState = getSavingState()

      const unsavedChanges =
        savingState === 'UPDATING_REQUIRED' ||
        savingState === 'UPDATING' ||
        savingState === 'UPDATING_FAILED'

      if (!unsavedChanges) {
        return
      }

      e.preventDefault()

      return (e.returnValue = warningText)
    }

    window.addEventListener('beforeunload', handleWindowClose)

    return () => {
      window.removeEventListener('beforeunload', handleWindowClose)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useAutoAuthRedirect(queryClient)

  const getLayout = Component.getLayout ?? ((page) => page)

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <StoreProvider rootStore={rootStore}>
          <AuthProvider>
            <FlagProvider>
              <Head>
                <title>Supabase</title>
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
              </Head>

              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}`}
                strategy="afterInteractive"
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}', { 'send_page_view': false });
              `}
              </Script>

              <PageTelemetry>
                <RouteValidationWrapper>
                  <AppBannerWrapper>{getLayout(<Component {...pageProps} />)}</AppBannerWrapper>
                </RouteValidationWrapper>
              </PageTelemetry>

              <HCaptchaLoadedStore />
              <PortalToast />
              <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
            </FlagProvider>
          </AuthProvider>
        </StoreProvider>
      </Hydrate>
    </QueryClientProvider>
  )
}

export default CustomApp
