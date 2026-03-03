import * as Sentry from '@sentry/nextjs'
import { HydrationBoundary, QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  FeatureFlagProvider,
  getFlags,
  TelemetryTagManager,
  ThemeProvider,
  useThemeSandbox,
} from 'common'
import MetaFaviconsPagesRouter from 'common/MetaFavicons/pages-router'
import { DevToolbar, DevToolbarProvider } from 'dev-tools'
import { customFont, sourceCodePro } from 'fonts'
import Head from 'next/head'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'
import { ErrorInfo, useCallback, type ComponentProps, type ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { SonnerToaster, TooltipProvider } from 'ui'

import { StudioCommandMenu } from '@/components/interfaces/App/CommandMenu'
import { StudioCommandProvider as CommandProvider } from '@/components/interfaces/App/CommandMenu/StudioCommandProvider'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { FeaturePreviewModal } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewModal'
import { MonacoThemeProvider } from '@/components/interfaces/App/MonacoThemeProvider'
import { RouteValidationWrapper } from '@/components/interfaces/App/RouteValidationWrapper'
import { MainScrollContainerProvider } from '@/components/layouts/MainScrollContainerContext'
import { GlobalErrorBoundaryState } from '@/components/ui/ErrorBoundary/GlobalErrorBoundaryState'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { AuthProvider } from '@/lib/auth'
import { API_URL, BASE_PATH, IS_PLATFORM, useDefaultProvider } from '@/lib/constants'
import { ProfileProvider } from '@/lib/profile'
import { ServiceRegistryProvider } from '@/lib/services/context'
import type { ServiceRegistry } from '@/lib/services/registry'
import { Telemetry } from '@/lib/telemetry'
import { AiAssistantStateContextProvider } from '@/state/ai-assistant-state'

const FeatureFlagProviderWithOrgContext = ({
  children,
  ...props
}: ComponentProps<typeof FeatureFlagProvider>) => {
  const { data: selectedOrganization } = useSelectedOrganizationQuery({ enabled: IS_PLATFORM })

  return (
    <FeatureFlagProvider {...props} organizationSlug={selectedOrganization?.slug ?? undefined}>
      {children}
    </FeatureFlagProvider>
  )
}

const errorBoundaryHandler = (error: Error, _info: ErrorInfo) => {
  Sentry.withScope(function (scope) {
    scope.setTag('globalErrorBoundary', true)
    const eventId = Sentry.captureException(error)
    if (eventId && error && typeof error === 'object') {
      ;(error as Error & { sentryId: string }).sentryId = eventId
    }
  })
  console.error(error.stack)
}

interface AppProvidersProps {
  registry: ServiceRegistry
  queryClient: QueryClient
  dehydratedState?: unknown
  children: ReactNode
}

/**
 * Full provider tree shared by _app.tsx (live registry) and integration tests (mock registry).
 * _app.tsx only handles the getLayout(Component) rendering.
 */
export function AppProviders({
  registry,
  queryClient,
  dehydratedState,
  children,
}: AppProvidersProps) {
  const { appTitle } = useCustomContent(['app:title'])
  const cloudProvider = useDefaultProvider()

  useThemeSandbox()

  const getConfigCatFlags = useCallback(
    (userEmail?: string) => {
      const customAttributes = cloudProvider ? { cloud_provider: cloudProvider } : undefined
      return getFlags(userEmail, customAttributes)
    },
    [cloudProvider]
  )

  const isTestEnv = process.env.NEXT_PUBLIC_NODE_ENV === 'test'

  return (
    <ErrorBoundary FallbackComponent={GlobalErrorBoundaryState} onError={errorBoundaryHandler}>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <NuqsAdapter>
            <ServiceRegistryProvider value={registry}>
              <AuthProvider>
                <FeatureFlagProviderWithOrgContext
                  API_URL={API_URL}
                  enabled={IS_PLATFORM}
                  getConfigCatFlags={getConfigCatFlags}
                >
                  <ProfileProvider>
                    <Head>
                      <title>{appTitle ?? 'Supabase'}</title>
                      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                      <meta property="og:image" content={`${BASE_PATH}/img/supabase-logo.png`} />
                      <meta name="googlebot" content="notranslate" />
                      {/* [Alaister]: This has to be an inline style tag here and not a separate component due to next/font */}
                      <style
                        dangerouslySetInnerHTML={{
                          __html: `:root{--font-custom:${customFont.style.fontFamily};--font-source-code-pro:${sourceCodePro.style.fontFamily};}`,
                        }}
                      />
                      {IS_PLATFORM && (
                        <link
                          rel="preconnect"
                          href={new URL(API_URL).origin}
                          crossOrigin="use-credentials"
                        />
                      )}
                    </Head>
                    <MetaFaviconsPagesRouter applicationName="Supabase Studio" includeManifest />
                    <TooltipProvider delayDuration={0}>
                      <RouteValidationWrapper>
                        <ThemeProvider
                          defaultTheme="system"
                          themes={['dark', 'light', 'classic-dark']}
                          enableSystem
                          disableTransitionOnChange
                        >
                          <DevToolbarProvider apiUrl={API_URL}>
                            <AiAssistantStateContextProvider>
                              <CommandProvider>
                                <FeaturePreviewContextProvider>
                                  <MainScrollContainerProvider>
                                    {children}
                                  </MainScrollContainerProvider>
                                  <StudioCommandMenu />
                                  <FeaturePreviewModal />
                                </FeaturePreviewContextProvider>
                                <SonnerToaster position="top-right" />
                                <MonacoThemeProvider />
                              </CommandProvider>
                            </AiAssistantStateContextProvider>
                            <DevToolbar />
                          </DevToolbarProvider>
                        </ThemeProvider>
                      </RouteValidationWrapper>
                    </TooltipProvider>
                    <Telemetry />
                    {!isTestEnv && (
                      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
                    )}
                  </ProfileProvider>
                </FeatureFlagProviderWithOrgContext>
              </AuthProvider>
            </ServiceRegistryProvider>
          </NuqsAdapter>
        </HydrationBoundary>
      </QueryClientProvider>
      <TelemetryTagManager />
    </ErrorBoundary>
  )
}
