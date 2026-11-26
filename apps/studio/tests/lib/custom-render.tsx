import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
  type AnyRouter,
} from '@tanstack/react-router'
import { render, renderHook, type RenderOptions } from '@testing-library/react'
import { AuthContext, AuthContext as AuthContextType, FrameworkProvider } from 'common'
import { useRouter as useMockRouter } from 'next-router-mock'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { useMemo } from 'react'
import { TooltipProvider } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'

// End of third-party imports

import { ProfileContext, type ProfileContextType } from '@/lib/profile'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

type AdapterProps = Partial<Parameters<typeof NuqsTestingAdapter>[0]>

const TestRouterProvider = ({
  children,
  router,
  initialUrl = '/',
}: {
  children: React.ReactNode
  router?: AnyRouter
  initialUrl?: string
}) => {
  const activeRouter = useMemo(
    () =>
      router ??
      createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory({ initialEntries: [initialUrl] }),
        parseSearch,
        stringifySearch,
      }),
    [router, initialUrl]
  )

  return <RouterContextProvider router={activeRouter}>{children}</RouterContextProvider>
}

const TestFrameworkProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useMockRouter()
  const value = useMemo(
    () => ({
      pathname: router.pathname,
      asPath: router.asPath,
      isReady: router.isReady,
      params: router.query,
      push: (path: string) => router.push(path),
    }),
    [router]
  )

  return <FrameworkProvider value={value}>{children}</FrameworkProvider>
}

export const CustomWrapper = ({
  children,
  queryClient,
  nuqs,
  profileContext,
  authContext,
  router,
  initialUrl,
}: {
  children: React.ReactNode
  queryClient?: QueryClient
  nuqs?: AdapterProps
  profileContext?: ProfileContextType
  authContext?: AuthContext
  router?: AnyRouter
  initialUrl?: string
}) => {
  const _queryClient =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

  let content = (
    <TestRouterProvider router={router} initialUrl={initialUrl}>
      <TestFrameworkProvider>
        <QueryClientProvider client={_queryClient}>
          <NuqsTestingAdapter {...nuqs}>
            <TooltipProvider>
              <CommandProvider openKey="">{children}</CommandProvider>
            </TooltipProvider>
          </NuqsTestingAdapter>
        </QueryClientProvider>
      </TestFrameworkProvider>
    </TestRouterProvider>
  )

  if (profileContext) {
    content = <ProfileContext.Provider value={profileContext}>{content}</ProfileContext.Provider>
  }

  if (authContext) {
    content = <AuthContext.Provider value={authContext}>{content}</AuthContext.Provider>
  }

  return content
}

type CustomRenderOpts = RenderOptions & {
  queryClient?: QueryClient
  nuqs?: AdapterProps
  profileContext?: ProfileContextType
  authContext?: AuthContextType
  router?: AnyRouter
  initialUrl?: string
}

export const customRender = (component: React.ReactElement, renderOptions?: CustomRenderOpts) => {
  return render(component, {
    wrapper: ({ children }) =>
      CustomWrapper({
        queryClient: renderOptions?.queryClient,
        nuqs: renderOptions?.nuqs,
        profileContext: renderOptions?.profileContext,
        authContext: renderOptions?.authContext,
        router: renderOptions?.router,
        initialUrl: renderOptions?.initialUrl,
        children,
      }),
    ...renderOptions,
  })
}

export const customRenderHook = <T,>(hook: () => T, renderOptions?: CustomRenderOpts) => {
  return renderHook(hook, {
    wrapper: ({ children }) =>
      CustomWrapper({
        children,
        queryClient: renderOptions?.queryClient,
        nuqs: renderOptions?.nuqs,
        profileContext: renderOptions?.profileContext,
        authContext: renderOptions?.authContext,
        router: renderOptions?.router,
        initialUrl: renderOptions?.initialUrl,
      }),
    ...renderOptions,
  })
}
