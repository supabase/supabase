import '../../packages/ui/build/css/themes/light.css'
import '../../packages/ui/build/css/themes/dark.css'

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

import { AppPropsWithLayout } from 'types'
import { ThemeProvider } from 'common'
import { useEffect, useMemo, useState } from 'react'
import { Hydrate, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RootStore } from 'stores'
import HCaptchaLoadedStore from 'stores/hcaptcha-loaded-store'
import { StoreProvider } from 'hooks'
import { AuthProvider } from 'lib/auth'
import { ProfileProvider } from 'lib/profile'
import { dart } from 'lib/constants/prism'
import { useRootQueryClient } from 'data/query-client'

import {
  PortalToast,
  RouteValidationWrapper,
  AppBannerWrapper,
  CommandMenuWrapper,
} from 'components/interfaces/App'
import PageTelemetry from 'components/ui/PageTelemetry'
import FlagProvider from 'components/ui/Flag/FlagProvider'
import useAutoAuthRedirect from 'hooks/misc/useAutoAuthRedirect'

import { TooltipProvider } from '@radix-ui/react-tooltip'
import Favicons from 'components/head/Favicons'
import { IS_PLATFORM } from 'lib/constants'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClient } from '@supabase/supabase-js'
import { LazyMotion } from 'framer-motion'

const motionFeatures = () => import('./motion-features').then((res) => res.default)

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

dart(Prism)

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const queryClient = useRootQueryClient()
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

  const AuthContainer = useMemo(
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
                            <LazyMotion features={motionFeatures} strict>
                              {getLayout(<Component {...pageProps} />)}
                            </LazyMotion>
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
