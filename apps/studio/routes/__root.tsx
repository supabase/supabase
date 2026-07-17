/// <reference types="vite/client" />

import 'react-data-grid/lib/styles.css'
import '@/styles/code.css'
import '@/styles/focus.css'
// Vite-only: defines @font-face for the custom fonts. The Next pipeline
// (pages/_app.tsx) loads these via next/font instead, so this import has no
// counterpart there — but dropping it under Vite makes the browser fall back
// to system fonts.
import '@/styles/fonts.css'
import '@/styles/graphiql-base.css'
import '@/styles/grid.css'
import '@/styles/globals.css'
import '@/styles/markdown-preview.css'
import '@/styles/monaco.css'
import '@/styles/react-data-grid-logs.css'
import '@/styles/reactflow.css'
import '@/styles/storage.css'
import '@/styles/stripe.css'
import '@/styles/ui.css'
import 'ui-patterns/ShimmeringLoader/index.css'

import * as Sentry from '@sentry/react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  redirect,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import {
  FeatureFlagProvider,
  getFlags,
  TelemetryTagManager,
  ThemeProvider,
  useThemeSandbox,
} from 'common'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { DevToolbar, DevToolbarProvider, DevToolbarTrigger, type ExtraTab } from 'dev-tools'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  type ComponentProps,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { TooltipProvider } from 'ui'
import { TimestampInfoProvider } from 'ui-patterns/TimestampInfo'

import { StudioCommandMenu } from '@/components/interfaces/App/CommandMenu'
import { StudioCommandProvider as CommandProvider } from '@/components/interfaces/App/CommandMenu/StudioCommandProvider'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { FeaturePreviewModal } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewModal'
import { MonacoThemeProvider } from '@/components/interfaces/App/MonacoThemeProvider'
import { RouteValidationWrapper } from '@/components/interfaces/App/RouteValidationWrapper'
import { MainScrollContainerProvider } from '@/components/layouts/MainScrollContainerContext'
import { BannerStackProvider } from '@/components/ui/BannerStack/BannerStackProvider'
import { GlobalErrorBoundaryState } from '@/components/ui/ErrorBoundary/GlobalErrorBoundaryState'
import { GlobalShortcuts } from '@/components/ui/GlobalShortcuts/GlobalShortcuts'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { AuthProvider } from '@/lib/auth'
import { configureMonacoLoader } from '@/lib/configure-monaco-loader'
import { API_URL, BASE_PATH, IS_PLATFORM, useDefaultProvider } from '@/lib/constants'
import { TimezoneProvider, useTimezone } from '@/lib/datetime'
// Custom adapter instead of `nuqs/adapters/tanstack-router` — the stock one
// injects a trailing slash before the query on every nuqs write (see module).
import { NuqsAdapter } from '@/lib/nuqs-tanstack-adapter'
import { ProfileProvider } from '@/lib/profile'
import { Telemetry } from '@/lib/telemetry'
import { ToastErrorTracker } from '@/lib/toast-errors'
import { Toaster } from '@/lib/toaster'
import Error404 from '@/pages/404'
import Error500 from '@/pages/500'
import { matchRedirect } from '@/redirects.shared'
import { AiAssistantStateContextProvider } from '@/state/ai-assistant-state'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(duration)

interface RouterContext {
  queryClient: QueryClient
}

const FeatureFlagProviderWithOrgContext = ({
  children,
  ...props
}: ComponentProps<typeof FeatureFlagProvider>) => {
  const { data: selectedOrganization } = useSelectedOrganizationQuery({ enabled: IS_PLATFORM })
  const cloudProvider = useDefaultProvider()

  const getConfigCatFlags = useCallback(
    (userEmail?: string) => {
      const customAttributes: Record<string, string> = {}
      if (cloudProvider) customAttributes.cloud_provider = cloudProvider
      if (selectedOrganization?.plan?.id) customAttributes.plan = selectedOrganization.plan.id
      return getFlags(userEmail, customAttributes)
    },
    [cloudProvider, selectedOrganization?.plan?.id]
  )

  return (
    <FeatureFlagProvider
      {...props}
      getConfigCatFlags={getConfigCatFlags}
      organizationSlug={selectedOrganization?.slug ?? undefined}
    >
      {children}
    </FeatureFlagProvider>
  )
}

// Bridges the user's stored timezone preference into TimestampInfoProvider so
// dayjs.tz.setDefault runs app-wide (see @/lib/datetime).
const TimestampInfoTimezoneBridge = ({ children }: { children: ReactNode }) => {
  const { timezone } = useTimezone()
  return <TimestampInfoProvider timezone={timezone}>{children}</TimestampInfoProvider>
}

const IS_NON_PROD_ENV =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

// Keep dev-only components out of the production bundle.
const IS_DEV_TOOLBAR_ENABLED = IS_NON_PROD_ENV

const ResourceWarningsTab = IS_DEV_TOOLBAR_ENABLED
  ? lazy(() =>
      import('@/components/ui/DevToolbar/ResourceWarningsTab').then((m) => ({
        default: m.ResourceWarningsTab,
      }))
    )
  : () => null

const ProjectStatusTab = IS_DEV_TOOLBAR_ENABLED
  ? lazy(() =>
      import('@/components/ui/DevToolbar/ProjectStatusTab').then((m) => ({
        default: m.ProjectStatusTab,
      }))
    )
  : () => null

const devToolbarExtraTabs: ExtraTab[] = IS_DEV_TOOLBAR_ENABLED
  ? [
      {
        id: 'warnings',
        label: 'Warnings',
        content: (
          <Suspense fallback={null}>
            <ResourceWarningsTab />
          </Suspense>
        ),
      },
      {
        id: 'project-status',
        label: 'Project Status',
        content: (
          <Suspense fallback={null}>
            <ProjectStatusTab />
          </Suspense>
        ),
      },
    ]
  : []

configureMonacoLoader()

// Non-prod (local + hosted staging) uses the white favicon, matching the Next
// build (pages/_app.tsx passes `/favicon/staging` to MetaFaviconsPagesRouter for
// non-prod). Uses the same synchronous NEXT_PUBLIC_ENVIRONMENT signal as
// IS_DEV_TOOLBAR_ENABLED above, so it works at module scope (the `head()` route
// option isn't a React component and can't run the async CLI check _app does).
const FAVICON_ROUTE = IS_NON_PROD_ENV ? '/favicon/staging' : '/favicon'
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
// The 128 variant ships as `favicon-128.png` (no dimensions in the filename);
// the rest follow `favicon-<size>.png`.
const FAVICON_PNG_VARIANTS: Array<{ sizes: string; file: string }> = [
  { sizes: '16x16', file: 'favicon-16x16.png' },
  { sizes: '32x32', file: 'favicon-32x32.png' },
  { sizes: '48x48', file: 'favicon-48x48.png' },
  { sizes: '96x96', file: 'favicon-96x96.png' },
  { sizes: '128x128', file: 'favicon-128.png' },
  { sizes: '180x180', file: 'favicon-180x180.png' },
  { sizes: '196x196', file: 'favicon-196x196.png' },
]

function buildRootHead() {
  const meta: Array<Record<string, string>> = [
    { charSet: 'utf-8' },
    { name: 'viewport', content: 'initial-scale=1.0, width=device-width' },
    { property: 'og:image', content: `${BASE_PATH}/img/supabase-og.png` },
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
    // Fonts (Inter, Manrope, Source Code Pro) are all vendored via @font-face in
    // styles/fonts.css — no Google Fonts CDN dependency at runtime, matching how
    // next/font self-hosts them on the Next build (and keeping self-hosted/offline
    // studio working).
    ...APPLE_TOUCH_ICON_SIZES.map((size) => ({
      rel: 'apple-touch-icon-precomposed',
      sizes: size,
      href: `${BASE_PATH}${FAVICON_ROUTE}/apple-icon-${size}.png`,
    })),
    ...FAVICON_PNG_VARIANTS.map(({ sizes, file }) => ({
      rel: 'icon',
      type: 'image/png',
      sizes,
      href: `${BASE_PATH}${FAVICON_ROUTE}/${file}`,
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
  if (!appTitle) return null

  return <title>{appTitle}</title>
}

const errorBoundaryHandler = (error: Error, _info: ErrorInfo) => {
  Sentry.withScope(function (scope) {
    scope.setTag('globalErrorBoundary', true)
    const eventId = Sentry.captureException(error)
    // Attach the Sentry event ID to the error object so it can be accessed by the error boundary
    if (eventId && error && typeof error === 'object') {
      ;(error as Error & { sentryId?: string }).sentryId = eventId
    }
  })

  console.error(error.stack)
}

function NotFound() {
  return <Error404 />
}

function ErrorBoundaryRoute({ error }: { error: Error }) {
  // Mirrors `errorBoundaryHandler` above (used by the in-tree
  // `react-error-boundary`) — TanStack's `errorComponent` covers
  // errors thrown during route load/render before the in-tree
  // boundary mounts, so we report from both layers.
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag('routerErrorComponent', true)
      const eventId = Sentry.captureException(error)
      if (eventId && error && typeof error === 'object') {
        ;(error as Error & { sentryId?: string }).sentryId = eventId
      }
    })
    console.error(error.stack)
  }, [error])

  return <Error500 />
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: buildRootHead,
  // Mirrors the redirect rules in `next.config.ts` / `vercel.ts`. Vercel's
  // edge layer already handles these for the platform deploy; this is the
  // self-hosted (Node-server) fallback and the client-side safety net.
  beforeLoad: ({ location }) => {
    const match = matchRedirect({
      pathname: location.pathname,
      search: location.search as Record<string, string | string[] | undefined>,
      isPlatform: IS_PLATFORM,
      hash: location.hash,
    })
    if (!match) return
    const href = BASE_PATH ? `${BASE_PATH}${match.destination}` : match.destination
    throw redirect({ href, statusCode: match.permanent ? 308 : 307 })
  },
  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: ErrorBoundaryRoute,
})

function RootComponent() {
  useThemeSandbox()

  return (
    <ErrorBoundary FallbackComponent={GlobalErrorBoundaryState} onError={errorBoundaryHandler}>
      <NuqsAdapter>
        <AuthProvider>
          <FeatureFlagProviderWithOrgContext API_URL={API_URL} enabled={IS_PLATFORM}>
            <ProfileProvider>
              <TimezoneProvider>
                <TimestampInfoTimezoneBridge>
                  <DynamicTitle />
                  <TooltipProvider>
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
                              <BannerStackProvider>
                                <FeaturePreviewContextProvider>
                                  <MainScrollContainerProvider>
                                    <Outlet />
                                  </MainScrollContainerProvider>
                                  <GlobalShortcuts />
                                  <StudioCommandMenu />
                                  <FeaturePreviewModal />
                                </FeaturePreviewContextProvider>
                              </BannerStackProvider>
                              <Toaster />
                              <ToastErrorTracker />
                              <MonacoThemeProvider />
                            </CommandProvider>
                          </AiAssistantStateContextProvider>
                          <DevToolbar extraTabs={devToolbarExtraTabs} />
                          <DevToolbarTrigger />
                        </DevToolbarProvider>
                      </ThemeProvider>
                    </RouteValidationWrapper>
                  </TooltipProvider>
                  <Telemetry />
                </TimestampInfoTimezoneBridge>
              </TimezoneProvider>
            </ProfileProvider>
          </FeatureFlagProviderWithOrgContext>
        </AuthProvider>
      </NuqsAdapter>
      <TelemetryTagManager />
    </ErrorBoundary>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // suppressHydrationWarning is for next-themes: it writes data-theme and
    // color-scheme onto <html> from localStorage pre-hydration, which the
    // prerendered shell can't know. Scoped to this element only.
    <html lang="en" suppressHydrationWarning>
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
