/// <reference types="vite/client" />

import 'react-data-grid/lib/styles.css'
import '@/styles/code.css'
import '@/styles/editor.css'
import '@/styles/focus.css'
import '@/styles/graphiql-base.css'
import '@/styles/grid.css'
import '@/styles/main.css'
import '@/styles/markdown-preview.css'
import '@/styles/monaco.css'
import '@/styles/react-data-grid-logs.css'
import '@/styles/reactflow.css'
import '@/styles/storage.css'
import '@/styles/stripe.css'
import '@/styles/toast.css'
import '@/styles/typography.css'
import '@/styles/ui.css'
import 'ui-patterns/ShimmeringLoader/index.css'
import 'ui/build/css/themes/dark.css'
import 'ui/build/css/themes/light.css'

import * as Sentry from '@sentry/react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { FeatureFlagProvider, getFlags } from 'common'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { useCallback, type ComponentProps, type ErrorInfo, type ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { GlobalErrorBoundaryState } from '@/components/ui/ErrorBoundary/GlobalErrorBoundaryState'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { AuthProvider } from '@/lib/auth'
import { API_URL, IS_PLATFORM, useDefaultProvider } from '@/lib/constants'
import { ProfileProvider } from '@/lib/profile'

interface RouterContext {
  queryClient: QueryClient
}

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

const errorBoundaryHandler = (error: Error, info: ErrorInfo) => {
  Sentry.withScope(function (scope) {
    scope.setTag('globalErrorBoundary', true)
    const eventId = Sentry.captureException(error)
    // Attach the Sentry event ID to the error object so it can be accessed by the error boundary
    if (eventId && error && typeof error === 'object') {
      ;(error as any).sentryId = eventId
    }
  })

  console.error(error.stack)
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Supabase',
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  const cloudProvider = useDefaultProvider()

  const getConfigCatFlags = useCallback(
    (userEmail?: string) => {
      const customAttributes = cloudProvider ? { cloud_provider: cloudProvider } : undefined
      return getFlags(userEmail, customAttributes)
    },
    [cloudProvider]
  )

  return (
    <ErrorBoundary FallbackComponent={GlobalErrorBoundaryState} onError={errorBoundaryHandler}>
      <NuqsAdapter>
        <AuthProvider>
          <FeatureFlagProviderWithOrgContext
            API_URL={API_URL}
            enabled={IS_PLATFORM}
            getConfigCatFlags={getConfigCatFlags}
          >
            <ProfileProvider>
              <Outlet />
            </ProfileProvider>
          </FeatureFlagProviderWithOrgContext>
        </AuthProvider>
      </NuqsAdapter>
    </ErrorBoundary>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'TanStack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
