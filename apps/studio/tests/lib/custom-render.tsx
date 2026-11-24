import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook, type RenderOptions } from '@testing-library/react'
import { AuthContext, AuthContext as AuthContextType, FrameworkProvider } from 'common'
import { useRouter as useMockRouter } from 'next-router-mock'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { useMemo } from 'react'
import { TooltipProvider } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'

// End of third-party imports

import { ProfileContext, type ProfileContextType } from '@/lib/profile'

type AdapterProps = Partial<Parameters<typeof NuqsTestingAdapter>[0]>

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
}: {
  children: React.ReactNode
  queryClient?: QueryClient
  nuqs?: AdapterProps
  profileContext?: ProfileContextType
  authContext?: AuthContext
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
    <TestFrameworkProvider>
      <QueryClientProvider client={_queryClient}>
        <NuqsTestingAdapter {...nuqs}>
          <TooltipProvider>
            <CommandProvider openKey="">{children}</CommandProvider>
          </TooltipProvider>
        </NuqsTestingAdapter>
      </QueryClientProvider>
    </TestFrameworkProvider>
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
}

export const customRender = (component: React.ReactElement, renderOptions?: CustomRenderOpts) => {
  return render(component, {
    wrapper: ({ children }) =>
      CustomWrapper({
        queryClient: renderOptions?.queryClient,
        nuqs: renderOptions?.nuqs,
        profileContext: renderOptions?.profileContext,
        authContext: renderOptions?.authContext,
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
      }),
    ...renderOptions,
  })
}
