import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, RenderOptions } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { TooltipProvider } from 'ui'

type AdapterProps = Parameters<typeof NuqsTestingAdapter>[0]

const CustomWrapper = ({
  children,
  queryClient,
  nuqs,
}: {
  children: React.ReactNode
  queryClient?: QueryClient
  nuqs?: AdapterProps
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
  nuqs?: AdapterProps
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
