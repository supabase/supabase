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
import * as Sentry from '@sentry/nextjs'
import { Hydrate, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import Head from 'next/head'
import { ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { FeatureFlagProvider, PageTelemetry, ThemeProvider, useThemeSandbox } from 'common'
import MetaFaviconsPagesRouter from 'common/MetaFavicons/pages-router'
import { RouteValidationWrapper } from 'components/interfaces/App'
import { AppBannerContextProvider } from 'components/interfaces/App/AppBannerWrapperContext'
import { StudioCommandMenu } from 'components/interfaces/App/CommandMenu'
import { FeaturePreviewContextProvider } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import FeaturePreviewModal from 'components/interfaces/App/FeaturePreview/FeaturePreviewModal'
import { MonacoThemeProvider } from 'components/interfaces/App/MonacoThemeProvider'
import { GenerateSql } from 'components/interfaces/SqlGenerator/SqlGenerator'
import { ErrorBoundaryState } from 'components/ui/ErrorBoundaryState'
import GroupsTelemetry from 'components/ui/GroupsTelemetry'
import { useRootQueryClient } from 'data/query-client'
import { customFont, sourceCodePro } from 'fonts'
import { AuthProvider } from 'lib/auth'
import { getFlags as getConfigCatFlags } from 'lib/configcat'
import { API_URL, BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { ProfileProvider } from 'lib/profile'
import HCaptchaLoadedStore from 'stores/hcaptcha-loaded-store'
import { AppPropsWithLayout } from 'types'
import { SonnerToaster, TooltipProvider } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'
import { useConsent } from 'ui-patterns/ConsentToast'

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

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const queryClient = useRootQueryClient()

  const getLayout = Component.getLayout ?? ((page) => page)

  const errorBoundaryHandler = (error: Error, info: ErrorInfo) => {
    Sentry.withScope(function (scope) {
      scope.setTag('globalErrorBoundary', true)
      Sentry.captureException(error)
    })

    console.error(error.stack)
  }

  useThemeSandbox()

  // Although this is "technically" breaking the rules of hooks
  // IS_PLATFORM never changes within a session, so this won't cause any issues
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { hasAcceptedConsent } = IS_PLATFORM ? useConsent() : { hasAcceptedConsent: true }

  const isTestEnv = process.env.NEXT_PUBLIC_NODE_ENV === 'test'

  return (
    <ErrorBoundary FallbackComponent={ErrorBoundaryState} onError={errorBoundaryHandler}>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <AuthProvider>
            <FeatureFlagProvider
              API_URL={API_URL}
              enabled={IS_PLATFORM}
              getConfigCatFlags={getConfigCatFlags}
            >
              <ProfileProvider>
                <Head>
                  <title>Supabase</title>
                  <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                  {/* [Alaister]: This has to be an inline style tag here and not a separate component due to next/font */}
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `:root{--font-custom:${customFont.style.fontFamily};--font-source-code-pro:${sourceCodePro.style.fontFamily};}`,
                    }}
                  />
                </Head>
                <MetaFaviconsPagesRouter applicationName="Supabase Studio" />
                <TooltipProvider delayDuration={0}>
                  <RouteValidationWrapper>
                    <ThemeProvider
                      defaultTheme="system"
                      themes={['dark', 'light', 'classic-dark']}
                      enableSystem
                      disableTransitionOnChange
                    >
                      <AppBannerContextProvider>
                        <CommandProvider>
                          <FeaturePreviewContextProvider>
                            {getLayout(<Component {...pageProps} />)}
                            <StudioCommandMenu />
                            <GenerateSql />
                            <FeaturePreviewModal />
                          </FeaturePreviewContextProvider>
                          <SonnerToaster position="top-right" />
                          <MonacoThemeProvider />
                        </CommandProvider>
                      </AppBannerContextProvider>
                    </ThemeProvider>
                  </RouteValidationWrapper>
                </TooltipProvider>

                <PageTelemetry
                  API_URL={API_URL}
                  hasAcceptedConsent={hasAcceptedConsent}
                  enabled={IS_PLATFORM}
                />
                <GroupsTelemetry hasAcceptedConsent={hasAcceptedConsent} />
                {!isTestEnv && <HCaptchaLoadedStore />}
                {!isTestEnv && <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />}
              </ProfileProvider>
            </FeatureFlagProvider>
          </AuthProvider>
        </Hydrate>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default CustomApp
