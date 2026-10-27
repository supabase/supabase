import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { afterEach, expect, it, vi } from 'vitest'

import EdgeFunctionDetailsLayout from './EdgeFunctionDetailsLayout'
import { MainScrollContainerProvider } from '@/components/layouts/MainScrollContainerContext'
import { MobileSheetProvider } from '@/components/layouts/Navigation/NavigationBar/MobileSheetContext'
import { BannerStackProvider } from '@/components/ui/BannerStack/BannerStackProvider'
import { configKeys } from '@/data/config/keys'
import { customDomainKeys } from '@/data/custom-domains/keys'
import type { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { edgeFunctionsKeys } from '@/data/edge-functions/keys'
import { miscKeys } from '@/data/misc/keys'
import { projectKeys } from '@/data/projects/keys'
import { subscriptionKeys } from '@/data/subscriptions/keys'
import { createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')

afterEach(() => {
  if (originalScrollTo) Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
})

it('lets self-hosted users copy the function URL from the detail toolbar', async () => {
  HTMLElement.prototype.scrollTo = vi.fn()
  const user = userEvent.setup()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(projectKeys.detail('default'), createMockProject({ ref: 'default' }))
  queryClient.setQueryData(configKeys.settingsV2('default'), {
    app_config: { endpoint: 'localhost:54321', protocol: 'http' },
  })
  queryClient.setQueryData(subscriptionKeys.addons('default'), { selected_addons: [] })
  queryClient.setQueryData(customDomainKeys.list('default'), {})
  queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), { disabled_features: [] })
  queryClient.setQueryData<EdgeFunction>(edgeFunctionsKeys.detail('default', undefined), {
    id: 'function-id',
    name: 'Send email',
    slug: 'send-email',
    status: 'ACTIVE',
    version: 2,
    created_at: new Date('2026-03-20T08:00:00Z').valueOf(),
    updated_at: new Date('2026-03-20T09:00:00Z').valueOf(),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/integrations/github/authorization',
    response: () =>
      HttpResponse.json<APIErrorBody>({ message: 'No GitHub authorization' }, { status: 404 }),
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => HttpResponse.json<never[]>([]),
  })

  customRender(
    <BannerStackProvider>
      <MobileSheetProvider>
        <MainScrollContainerProvider>
          <EdgeFunctionDetailsLayout title="Settings">Function settings</EdgeFunctionDetailsLayout>
        </MainScrollContainerProvider>
      </MobileSheetProvider>
    </BannerStackProvider>,
    { queryClient }
  )

  await user.click(await screen.findByRole('button', { name: 'Copy URL' }))

  expect(await navigator.clipboard.readText()).toBe(
    'http://localhost:54321/functions/v1/send-email'
  )
})
