import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, RenderOptions } from '@testing-library/react'
import { TestingAdapterProps } from './render-with-nuqs'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { TooltipProvider } from 'ui'

const CustomWrapper = ({
  children,
  queryClient,
  nuqs,
}: {
  children: React.ReactNode
  queryClient?: QueryClient
  nuqs?: TestingAdapterProps
}) => {
  const _queryClient = queryClient ?? new QueryClient()

  return (
    <QueryClientProvider client={_queryClient}>
      <NuqsTestingAdapter {...nuqs}>
        <TooltipProvider>{children}</TooltipProvider>
      </NuqsTestingAdapter>
    </QueryClientProvider>
  )
}

type CustomRenderOpts = RenderOptions & {
  queryClient?: QueryClient
  nuqs?: TestingAdapterProps
}

export const customRender = (component: React.ReactElement, renderOptions?: CustomRenderOpts) => {
  return render(component, {
    wrapper: ({ children }) =>
      CustomWrapper({
        queryClient: renderOptions?.queryClient,
        nuqs: renderOptions?.nuqs,
        children,
      }),
    ...renderOptions,
  })
}
