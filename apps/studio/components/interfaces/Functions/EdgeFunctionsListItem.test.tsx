import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { Table, TableBody } from 'ui'
import { expect, it } from 'vitest'

import { EdgeFunctionsListItem } from './EdgeFunctionsListItem'
import { customDomainKeys } from '@/data/custom-domains/keys'
import { edgeFunctionsKeys } from '@/data/edge-functions/keys'
import { projectKeys } from '@/data/projects/keys'
import { subscriptionKeys } from '@/data/subscriptions/keys'
import { createMockProject } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

type FunctionResponse = components['schemas']['FunctionResponse_Output']
type ProjectSettingsResponse = components['schemas']['ProjectSettingsResponse_Output']

const edgeFunction: FunctionResponse = {
  id: 'function-id',
  name: 'Send email',
  slug: 'send-email',
  status: 'ACTIVE',
  version: 2,
  created_at: new Date('2026-03-20T10:00:00Z').valueOf(),
  updated_at: new Date('2026-03-20T11:00:00Z').valueOf(),
}

const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(projectKeys.detail('default'), createMockProject({ ref: 'default' }))
  queryClient.setQueryData(subscriptionKeys.addons('default'), { selected_addons: [] })
  queryClient.setQueryData(customDomainKeys.list('default'), {})
  queryClient.setQueryData(edgeFunctionsKeys.list('default'), [edgeFunction])
  return queryClient
}

const mockProjectSettings = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/settings',
    response: () =>
      HttpResponse.json<ProjectSettingsResponse>({
        app_config: {
          endpoint: 'default.supabase.co',
          db_schema: 'public',
          storage_endpoint: 'default.supabase.co',
        },
        cloud_provider: 'AWS',
        db_dns_name: 'db.default.supabase.co',
        db_host: 'db.default.supabase.co',
        db_name: 'postgres',
        db_port: 5432,
        db_user: 'postgres',
        inserted_at: '2026-01-01T00:00:00.000Z',
        name: 'Production',
        ref: 'default',
        region: 'us-east-1',
        ssl_enforced: false,
        status: 'ACTIVE_HEALTHY',
      }),
  })
}

it('shows a loader instead of an undefined function URL until the project endpoint loads', async () => {
  const user = userEvent.setup()
  routerMock.setCurrentUrl('/projects/default')
  mockProjectSettings()

  const { container } = customRender(
    <Table>
      <TableBody>
        <EdgeFunctionsListItem function={edgeFunction} />
      </TableBody>
    </Table>,
    { queryClient: createQueryClient() }
  )

  expect(screen.queryByText(/undefined\/functions\/v1/)).not.toBeInTheDocument()
  expect(container.querySelector('.shimmering-loader')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Copy function URL' })).not.toBeInTheDocument()

  const functionUrl = 'https://default.supabase.co/functions/v1/send-email'
  expect(await screen.findByText(functionUrl)).toBeInTheDocument()
  expect(container.querySelector('.shimmering-loader')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Copy function URL' }))
  expect(await navigator.clipboard.readText()).toBe(functionUrl)
})
