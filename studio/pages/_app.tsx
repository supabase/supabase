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

import { loader } from '@monaco-editor/react'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClient } from '@supabase/supabase-js'
import { Hydrate, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'common'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
// @ts-ignore
import Prism from 'prism-react-renderer/prism'

import Favicons from 'components/head/Favicons'
import {
  AppBannerWrapper,
  CommandMenuWrapper,
  PortalToast,
  RouteValidationWrapper,
} from 'components/interfaces/App'
import FlagProvider from 'components/ui/Flag/FlagProvider'
import PageTelemetry from 'components/ui/PageTelemetry'
import { useRootQueryClient } from 'data/query-client'
import { StoreProvider } from 'hooks'
import useAutoAuthRedirect from 'hooks/misc/useAutoAuthRedirect'
import { AuthProvider } from 'lib/auth'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { dart } from 'lib/constants/prism'
import { ProfileProvider } from 'lib/profile'
import { RootStore } from 'stores'
import HCaptchaLoadedStore from 'stores/hcaptcha-loaded-store'
import { AppPropsWithLayout } from 'types'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dart(Prism)

loader.config({
  // [Joshen] Attempt for offline support/bypass ISP issues is to store the assets required for monaco
  // locally. We're however, only storing the assets which we need (based on what the network tab loads
  // while using monaco). If we end up facing more effort trying to maintain this, probably to either
  // use cloudflare or find some way to pull all the files from a CDN via a CLI, rather than tracking individual files
  // The alternative was to import * as monaco from 'monaco-editor' but i couldn't get it working
  paths: { vs: `${BASE_PATH}/monaco-editor` },
  // paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.37.0/min/vs' },
})

// [Joshen TODO] Once we settle on the new nav layout - we'll need a lot of clean up in terms of our layout components
// a lot of them are unnecessary and introduce way too many cluttered CSS especially with the height styles that make
// debugging way too difficult. Ideal scenario is we just have one AppLayout to control the height and scroll areas of
// the dashboard, all other layout components should not be doing that

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
