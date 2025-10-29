import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RenderOptions, render, renderHook } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
// End of third-party imports

import { ProfileContext, type ProfileContextType } from 'lib/profile'
import { TooltipProvider } from 'ui'

type AdapterProps = Partial<Parameters<typeof NuqsTestingAdapter>[0]>

const CustomWrapper = ({
  children,
  queryClient,
  nuqs,
  profileContext,
}: {
  children: React.ReactNode
  queryClient?: QueryClient
  nuqs?: AdapterProps
  profileContext?: ProfileContextType
}) => {
  const _queryClient =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

  const content = (
    <QueryClientProvider client={_queryClient}>
      <NuqsTestingAdapter {...nuqs}>
        <TooltipProvider>{children}</TooltipProvider>
      </NuqsTestingAdapter>
    </QueryClientProvider>
  )

  return profileContext ? (
    <ProfileContext.Provider value={profileContext}>{content}</ProfileContext.Provider>
  ) : (
    content
  )
}

type CustomRenderOpts = RenderOptions & {
  queryClient?: QueryClient
  nuqs?: AdapterProps
  profileContext?: ProfileContextType
}

export const customRender = (component: React.ReactElement, renderOptions?: CustomRenderOpts) => {
  return render(component, {
    wrapper: ({ children }) =>
      CustomWrapper({
        queryClient: renderOptions?.queryClient,
        nuqs: renderOptions?.nuqs,
        profileContext: renderOptions?.profileContext,
        children,
      }),
    ...renderOptions,
  })
}

export const customRenderHook = (hook: () => any, renderOptions?: CustomRenderOpts) => {
  return renderHook(hook, {
    wrapper: ({ children }) =>
      CustomWrapper({
        children,
        queryClient: renderOptions?.queryClient,
        nuqs: renderOptions?.nuqs,
        profileContext: renderOptions?.profileContext,
      }),
    ...renderOptions,
  })
}
