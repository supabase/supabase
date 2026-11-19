import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook, type RenderOptions } from '@testing-library/react'
import { AuthContext, AuthContext as AuthContextType } from 'common'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { TooltipProvider } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'

// End of third-party imports

import { ProfileContext, type ProfileContextType } from '@/lib/profile'

type AdapterProps = Partial<Parameters<typeof NuqsTestingAdapter>[0]>

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
    <QueryClientProvider client={_queryClient}>
      <NuqsTestingAdapter {...nuqs}>
        <TooltipProvider>
          <CommandProvider openKey="">{children}</CommandProvider>
        </TooltipProvider>
      </NuqsTestingAdapter>
    </QueryClientProvider>
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
