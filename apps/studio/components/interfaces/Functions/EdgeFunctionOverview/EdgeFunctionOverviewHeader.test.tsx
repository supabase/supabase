import { QueryClient } from '@tanstack/react-query'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

import { EdgeFunctionOverviewHeader } from './EdgeFunctionOverviewHeader'
import { configKeys } from '@/data/config/keys'
import { customDomainKeys } from '@/data/custom-domains/keys'
import type { EdgeFunction } from '@/data/edge-functions/edge-function-query'
import { edgeFunctionsKeys } from '@/data/edge-functions/keys'
import { projectKeys } from '@/data/projects/keys'
import { subscriptionKeys } from '@/data/subscriptions/keys'
import { createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'

const functionDetails: EdgeFunction = {
  id: 'function-id',
  name: 'Send email',
  slug: 'send-email',
  status: 'ACTIVE',
  version: 2,
  created_at: new Date('2026-03-20T10:00:00Z').valueOf(),
  updated_at: new Date('2026-03-20T11:00:00Z').valueOf(),
}

it('announces when function details load and copies the invoke URL', async () => {
  const user = userEvent.setup()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(projectKeys.detail('default'), createMockProject({ ref: 'default' }))
  queryClient.setQueryData(configKeys.settingsV2('default'), {
    app_config: { endpoint: 'default.supabase.co' },
  })
  queryClient.setQueryData(subscriptionKeys.addons('default'), { selected_addons: [] })
  queryClient.setQueryData(customDomainKeys.list('default'), {})
  customRender(<EdgeFunctionOverviewHeader />, { queryClient })

  const status = screen.getByRole('status')
  expect(status).toHaveTextContent('Loading function details')
  expect(screen.queryByRole('button', { name: 'Copy function URL' })).not.toBeInTheDocument()

  act(() => {
    queryClient.setQueryData(edgeFunctionsKeys.detail('default', undefined), functionDetails)
  })

  expect(await screen.findByRole('heading', { name: 'Send email' })).toBeVisible()
  expect(screen.getByRole('status')).toBe(status)
  expect(status).toHaveTextContent('Send email details loaded. Last deployed')
  expect(screen.getByText('https://default.supabase.co/functions/v1/send-email')).toBeVisible()

  await user.click(screen.getByRole('button', { name: 'Copy function URL' }))

  expect(await navigator.clipboard.readText()).toBe(
    'https://default.supabase.co/functions/v1/send-email'
  )
})
