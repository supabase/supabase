import 'react-data-grid/lib/styles.css'
import 'styles/code.scss'
import 'styles/contextMenu.scss'
import 'styles/date-picker.scss'
import 'styles/editor.scss'
import 'styles/graphiql-base.scss'
import 'styles/grid.scss'
import 'styles/main.scss'
import 'styles/markdown-preview.scss'
import 'styles/monaco.scss'
import 'styles/react-data-grid-logs.scss'
import 'styles/reactflow.scss'
import 'styles/storage.scss'
import 'styles/stripe.scss'
import 'styles/toast.scss'
import 'styles/ui.scss'
import 'ui/build/css/themes/dark.css'
import 'ui/build/css/themes/light.css'

import { loader } from '@monaco-editor/react'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  UIMatch,
  useMatches,
} from '@remix-run/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, useThemeSandbox } from 'common'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import Head from 'next/head'
import { ErrorInfo, useMemo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import MetaFaviconsPagesRouter from 'common/MetaFavicons/pages-router'
import { AppBannerWrapper, RouteValidationWrapper } from 'components/interfaces/App'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { StudioCommandMenu } from 'components/interfaces/App/CommandMenu'
import { FeaturePreviewContextProvider } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import FeaturePreviewModal from 'components/interfaces/App/FeaturePreview/FeaturePreviewModal'
import { GenerateSql } from 'components/interfaces/SqlGenerator/SqlGenerator'
import { ErrorBoundaryState } from 'components/ui/ErrorBoundaryState'
import FlagProvider from 'components/ui/Flag/FlagProvider'
import { Loading } from 'components/ui/Loading'
import PageTelemetry from 'components/ui/PageTelemetry'
import { useRootQueryClient } from 'data/query-client'
import { AuthProvider } from 'lib/auth'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { ProfileProvider } from 'lib/profile'
import { identity } from 'lib/void'
import HCaptchaLoadedStore from 'stores/hcaptcha-loaded-store'
import { NextPageWithLayout } from 'types'
import { SonnerToaster } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

loader.config({
  // [Joshen] Attempt for offline support/bypass ISP issues is to store the assets required for monaco
  // locally. We're however, only storing the assets which we need (based on what the network tab loads
  // while using monaco). If we end up facing more effort trying to maintain this, probably to either
  // use cloudflare or find some way to pull all the files from a CDN via a CLI, rather than tracking individual files
  // The alternative was to import * as monaco from 'monaco-editor' but i couldn't get it working
  paths: {
    vs: IS_PLATFORM
      ? 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.37.0/min/vs'
      : `${BASE_PATH}/monaco-editor`,
  },
})

// [Joshen TODO] Once we settle on the new nav layout - we'll need a lot of clean up in terms of our layout components
// a lot of them are unnecessary and introduce way too many cluttered CSS especially with the height styles that make
// debugging way too difficult. Ideal scenario is we just have one AppLayout to control the height and scroll areas of
// the dashboard, all other layout components should not be doing that

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          type="text/css"
          data-name="vs/editor/editor.main"
          href={
            IS_PLATFORM
              ? 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.37.0/min/vs/editor/editor.main.css'
              : `${BASE_PATH}/monaco-editor/editor/editor.main.css`
          }
        />
        <link rel="stylesheet" type="text/css" href={`${BASE_PATH}/css/fonts.css`} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const queryClient = useRootQueryClient()

  const TelemetryContainer = useMemo(
    // eslint-disable-next-line react/display-name
    () => (props: any) => {
      return IS_PLATFORM ? <PageTelemetry>{props.children}</PageTelemetry> : <>{props.children}</>
    },
    []
  )

  const errorBoundaryHandler = (error: Error, info: ErrorInfo) => {
    // Sentry.withScope(function (scope) {
    //   scope.setTag('globalErrorBoundary', true)
    //   Sentry.captureException(error)
    // })

    console.error(error.stack)
  }

  useThemeSandbox()

  const isTestEnv = process.env.NEXT_PUBLIC_NODE_ENV === 'test'

  const matches = useMatches() as UIMatch<unknown, { getLayout: NextPageWithLayout['getLayout'] }>[]
  const lastMatch = matches[matches.length - 1]
  const getLayout = lastMatch?.handle?.['getLayout'] ?? identity

  return (
    <ErrorBoundary FallbackComponent={ErrorBoundaryState} onError={errorBoundaryHandler}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FlagProvider>
            <ProfileProvider>
              <Head>
                <title>Supabase</title>
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
              </Head>
              <MetaFaviconsPagesRouter applicationName="Supabase Studio" />
              <TelemetryContainer>
                <TooltipProvider>
                  <RouteValidationWrapper>
                    <ThemeProvider
                      defaultTheme="system"
                      themes={['dark', 'light', 'classic-dark']}
                      enableSystem
                      disableTransitionOnChange
                    >
                      <AppBannerContextProvider>
                        <CommandProvider>
                          <AppBannerWrapper>
                            <FeaturePreviewContextProvider>
                              {getLayout(<Outlet />)}
                              <StudioCommandMenu />
                              <GenerateSql />
                              <FeaturePreviewModal />
                            </FeaturePreviewContextProvider>
                          </AppBannerWrapper>
                          <SonnerToaster position="top-right" />
                        </CommandProvider>
                      </AppBannerContextProvider>
                    </ThemeProvider>
                  </RouteValidationWrapper>
                </TooltipProvider>
              </TelemetryContainer>

              {!isTestEnv && <HCaptchaLoadedStore />}
              {!isTestEnv && <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />}
            </ProfileProvider>
          </FlagProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export function HydrateFallback() {
  return (
    <div className="flex flex-col flex-1 bg-alternative h-full items-center justify-center">
      <Loading />
    </div>
  )
}
