/// <reference types="vite/client" />

import 'react-data-grid/lib/styles.css'
import '@/styles/code.css'
import '@/styles/editor.css'
import '@/styles/focus.css'
import '@/styles/fonts.css'
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
import { useCallback, useEffect, type ComponentProps, type ErrorInfo, type ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { GlobalErrorBoundaryState } from '@/components/ui/ErrorBoundary/GlobalErrorBoundaryState'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { AuthProvider } from '@/lib/auth'
import { API_URL, BASE_PATH, IS_PLATFORM, useDefaultProvider } from '@/lib/constants'
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

const FAVICON_ROUTE = '/favicon'
const THEME_COLOR = '1E1E1E'
const APPLICATION_NAME = 'Supabase Studio'

const APPLE_TOUCH_ICON_SIZES = [
  '57x57',
  '60x60',
  '72x72',
  '76x76',
  '114x114',
  '120x120',
  '144x144',
  '152x152',
]
const FAVICON_PNG_SIZES = ['16x16', '32x32', '48x48', '96x96', '128x128', '180x180', '196x196']

function buildRootHead() {
  const meta: Array<Record<string, string>> = [
    { charSet: 'utf-8' },
    { name: 'viewport', content: 'initial-scale=1.0, width=device-width' },
    { property: 'og:image', content: `${BASE_PATH}/img/supabase-logo.png` },
    { name: 'googlebot', content: 'notranslate' },
    { name: 'application-name', content: APPLICATION_NAME },
    { name: 'msapplication-TileColor', content: `#${THEME_COLOR}` },
    { name: 'msapplication-TileImage', content: `${BASE_PATH}${FAVICON_ROUTE}/mstile-144x144.png` },
    {
      name: 'msapplication-square70x70logo',
      content: `${BASE_PATH}${FAVICON_ROUTE}/mstile-70x70.png`,
    },
    {
      name: 'msapplication-square150x150logo',
      content: `${BASE_PATH}${FAVICON_ROUTE}/mstile-150x150.png`,
    },
    {
      name: 'msapplication-wide310x150logo',
      content: `${BASE_PATH}${FAVICON_ROUTE}/mstile-310x150.png`,
    },
    {
      name: 'msapplication-square310x310logo',
      content: `${BASE_PATH}${FAVICON_ROUTE}/mstile-310x310.png`,
    },
    { name: 'theme-color', content: `#${THEME_COLOR}` },
    { title: 'Supabase' },
  ]

  const links: Array<Record<string, string>> = [
    // Google Fonts — Source Code Pro (the local CustomFont is declared in styles/fonts.css).
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600;700&display=swap',
    },
    ...APPLE_TOUCH_ICON_SIZES.map((size) => ({
      rel: 'apple-touch-icon-precomposed',
      sizes: size,
      href: `${BASE_PATH}${FAVICON_ROUTE}/apple-icon-${size}.png`,
    })),
    ...FAVICON_PNG_SIZES.map((size) => ({
      rel: 'icon',
      type: 'image/png',
      sizes: size,
      href: `${BASE_PATH}${FAVICON_ROUTE}/favicon-${size}.png`,
    })),
    { rel: 'shortcut icon', href: `${BASE_PATH}${FAVICON_ROUTE}/favicon.ico` },
    { rel: 'icon', type: 'image/x-icon', href: `${BASE_PATH}${FAVICON_ROUTE}/favicon.ico` },
    { rel: 'apple-touch-icon', href: `${BASE_PATH}${FAVICON_ROUTE}/favicon.ico` },
    { rel: 'manifest', href: `${BASE_PATH}${FAVICON_ROUTE}/manifest.json` },
  ]

  if (IS_PLATFORM) {
    links.unshift({
      rel: 'preconnect',
      href: new URL(API_URL).origin,
      crossOrigin: 'use-credentials',
    })
  }

  return { meta, links }
}

function DynamicTitle() {
  const { appTitle } = useCustomContent(['app:title'])
  useEffect(() => {
    if (appTitle && typeof document !== 'undefined') document.title = appTitle
  }, [appTitle])
  return null
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
  head: buildRootHead,
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
              <DynamicTitle />
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
