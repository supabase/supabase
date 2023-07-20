import '../../packages/ui/build/css/themes/dark.css'
import '../../packages/ui/build/css/themes/light.css'

import 'styles/code.scss'
import 'styles/contextMenu.scss'
import 'styles/date-picker.scss'
import 'styles/editor.scss'
import 'styles/graphiql-base.scss'
import 'styles/grid.scss'
import 'styles/main.scss'
import 'styles/monaco.scss'
import 'styles/react-data-grid-logs.scss'
import 'styles/storage.scss'
import 'styles/stripe.scss'
import 'styles/toast.scss'
import 'styles/ui.scss'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// @ts-ignore
import Prism from 'prism-react-renderer/prism'
import Head from 'next/head'

import { Hydrate, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'common'
import { useRootQueryClient } from 'data/query-client'
import { StoreProvider } from 'hooks'
import { AuthProvider } from 'lib/auth'
import { dart } from 'lib/constants/prism'
import { ProfileProvider } from 'lib/profile'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RootStore } from 'stores'
import HCaptchaLoadedStore from 'stores/hcaptcha-loaded-store'
import { AppPropsWithLayout } from 'types'

import {
  AppBannerWrapper,
  CommandMenuWrapper,
  PortalToast,
  RouteValidationWrapper,
} from 'components/interfaces/App'
import FlagProvider from 'components/ui/Flag/FlagProvider'
import PageTelemetry from 'components/ui/PageTelemetry'
import useAutoAuthRedirect from 'hooks/misc/useAutoAuthRedirect'

import { TooltipProvider } from '@radix-ui/react-tooltip'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClient } from '@supabase/supabase-js'
import Favicons from 'components/head/Favicons'
import ConsentToast from 'components/ui/ConsentToast'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { toast } from 'react-hot-toast'
import { useAppStateSnapshot } from 'state/app-state'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dart(Prism)

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const consentToastId = useRef<string>()
  const queryClient = useRootQueryClient()
  const snap = useAppStateSnapshot()
  const [rootStore] = useState(() => new RootStore())

  // [Joshen] Some issues with using createBrowserSupabaseClient
  const [supabase] = useState(() =>
    IS_PLATFORM
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL as string,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
        )
      : undefined
  )

  const getSavingState = () => rootStore.content.savingState

  useEffect(() => {
    // Check for telemetry consent
    if (typeof window !== 'undefined') {
      const onAcceptConsent = () => {
        snap.setIsOptedInTelemetry(true)
        if (consentToastId.current) toast.dismiss(consentToastId.current)
      }

      const onOptOut = () => {
        snap.setIsOptedInTelemetry(false)
        if (consentToastId.current) toast.dismiss(consentToastId.current)
      }

      const hasAcknowledgedConsent = localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      if (hasAcknowledgedConsent === null) {
        consentToastId.current = toast(
          <ConsentToast onAccept={onAcceptConsent} onOptOut={onOptOut} />,
          {
            id: 'consent-toast',
            position: 'bottom-right',
            duration: Infinity,
          }
        )
      }
    }

    // prompt the user if they try and leave with unsaved content store changes
    const warningText = 'You have unsaved changes - are you sure you wish to leave this page?'

    const handleWindowClose = (e: BeforeUnloadEvent) => {
      const savingState = getSavingState()
      const unsavedChanges =
        savingState === 'UPDATING_REQUIRED' ||
        savingState === 'UPDATING' ||
        savingState === 'UPDATING_FAILED'

      if (!unsavedChanges) return
      e.preventDefault()
      return (e.returnValue = warningText)
    }

    window.addEventListener('beforeunload', handleWindowClose)

    return () => window.removeEventListener('beforeunload', handleWindowClose)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useAutoAuthRedirect(queryClient)

  const getLayout = Component.getLayout ?? ((page) => page)

  const AuthContainer = useMemo(
    // eslint-disable-next-line react/display-name
    () => (props: any) => {
      return IS_PLATFORM ? (
        <SessionContextProvider supabaseClient={supabase as any}>
          <AuthProvider>{props.children}</AuthProvider>
        </SessionContextProvider>
      ) : (
        <AuthProvider>{props.children}</AuthProvider>
      )
    },
    [supabase]
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <StoreProvider rootStore={rootStore}>
          <AuthContainer>
            <ProfileProvider>
              <FlagProvider>
                <Head>
                  <title>Supabase</title>
                  <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                </Head>
                <Favicons />

                <PageTelemetry>
                  <TooltipProvider>
                    <RouteValidationWrapper>
                      <ThemeProvider>
                        <CommandMenuWrapper>
                          <AppBannerWrapper>
                            {getLayout(<Component {...pageProps} />)}
                          </AppBannerWrapper>
                        </CommandMenuWrapper>
                      </ThemeProvider>
                    </RouteValidationWrapper>
                  </TooltipProvider>
                </PageTelemetry>

                <HCaptchaLoadedStore />
                <PortalToast />
                <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
              </FlagProvider>
            </ProfileProvider>
          </AuthContainer>
        </StoreProvider>
      </Hydrate>
    </QueryClientProvider>
  )
}

export default CustomApp
