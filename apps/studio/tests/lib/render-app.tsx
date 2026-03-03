/**
 * Test render helpers for components and pages that use useService().
 *
 * Uses the same AppProviders tree as production so behaviour in tests matches
 * production exactly. The only difference is the ServiceRegistry — tests
 * receive a mock registry, production receives the live registry.
 */
import { QueryClient } from '@tanstack/react-query'
import { type RenderOptions, render, renderHook } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { AppProviders } from '@/lib/app-providers'
import type { ServiceRegistry } from '@/lib/services/registry'
import type { NextPageWithLayout } from '@/types'
import { routerMock } from './route-mock'
import { createMockRegistry } from './service-mocks'

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function AppWrapper({
  children,
  registry,
  queryClient,
}: {
  children: ReactNode
  registry: ServiceRegistry
  queryClient: QueryClient
}) {
  return (
    <AppProviders registry={registry} queryClient={queryClient}>
      {children}
    </AppProviders>
  )
}

// ---------------------------------------------------------------------------
// renderApp — full-page render including the page's layout chain
// ---------------------------------------------------------------------------

export type RenderAppOptions = RenderOptions & {
  /** Per-service overrides. Defaults to createMockRegistry(). */
  services?: Partial<ServiceRegistry>
  queryClient?: QueryClient
  /** Sets the router URL before rendering (e.g. '/project/abc/storage/files'). */
  path?: string
  /** Props passed to the page component. */
  pageProps?: Record<string, unknown>
}

/**
 * Renders a Next.js page component inside AppProviders, including its full
 * layout chain (via `PageComponent.getLayout`). Use this for full-page
 * integration tests where you need layouts to render and provide context.
 *
 * ```tsx
 * renderApp(StorageBucketsPage, {
 *   path: '/project/test-ref/storage/files',
 *   services: {
 *     storage: createMockStorageService({
 *       getBuckets: vi.fn().mockResolvedValue([{ id: '1', name: 'photos' }]),
 *     }),
 *   },
 * })
 * await screen.findByText('photos')
 * ```
 */
export function renderApp(
  PageComponent: NextPageWithLayout,
  { services, queryClient, path, pageProps, ...renderOptions }: RenderAppOptions = {}
) {
  if (path) routerMock.setCurrentUrl(path)

  const registry = createMockRegistry(services)
  const client = queryClient ?? makeQueryClient()

  const page = <PageComponent dehydratedState={undefined} {...pageProps} /> as ReactElement
  const withLayout = PageComponent.getLayout?.(page) ?? page

  return render(withLayout, {
    wrapper: ({ children }) => (
      <AppWrapper registry={registry} queryClient={client}>
        {children}
      </AppWrapper>
    ),
    ...renderOptions,
  })
}

// ---------------------------------------------------------------------------
// renderWithRegistry — component/hook render without layout wrapping
// ---------------------------------------------------------------------------

export type RenderWithRegistryOptions = RenderOptions & {
  services?: Partial<ServiceRegistry>
  queryClient?: QueryClient
}

/**
 * Renders a component inside AppProviders backed by mock services, without
 * layout wrapping. Use for component-level tests.
 *
 * ```tsx
 * const { getByText } = renderWithRegistry(<MyComponent />, {
 *   services: {
 *     projects: createMockProjectsService({
 *       getProjectDetail: vi.fn().mockResolvedValue(myProject),
 *     }),
 *   },
 * })
 * ```
 */
export function renderWithRegistry(
  ui: React.ReactElement,
  { services, queryClient, ...renderOptions }: RenderWithRegistryOptions = {}
) {
  const registry = createMockRegistry(services)
  const client = queryClient ?? makeQueryClient()

  return render(ui, {
    wrapper: ({ children }) => (
      <AppWrapper registry={registry} queryClient={client}>
        {children}
      </AppWrapper>
    ),
    ...renderOptions,
  })
}

export type RenderHookWithRegistryOptions<TProps> = {
  services?: Partial<ServiceRegistry>
  queryClient?: QueryClient
  initialProps?: TProps
}

/**
 * Renders a hook inside AppProviders backed by mock services.
 *
 * ```ts
 * const { result } = renderHookWithRegistry(
 *   () => useProjectDetailQuery({ ref: 'abc' }),
 *   { services: { projects: createMockProjectsService() } }
 * )
 * ```
 */
export function renderHookWithRegistry<TResult, TProps>(
  hook: (props: TProps) => TResult,
  { services, queryClient, initialProps }: RenderHookWithRegistryOptions<TProps> = {}
) {
  const registry = createMockRegistry(services)
  const client = queryClient ?? makeQueryClient()

  return renderHook(hook, {
    wrapper: ({ children }) => (
      <AppWrapper registry={registry} queryClient={client}>
        {children}
      </AppWrapper>
    ),
    initialProps,
  })
}
