import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RolesList } from './RolesList'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']

mockAnimationsApi()

const project: ProjectDetailResponse = {
  id: 1,
  ref: 'default',
  name: 'Default Project',
  organization_id: 1,
  status: 'ACTIVE_HEALTHY',
  cloud_provider: 'localhost',
  region: 'local',
  db_host: 'localhost',
  restUrl: 'http://localhost:8000/rest/v1/',
  connectionString: null,
  inserted_at: '2021-08-02T06:40:40.646Z',
  updated_at: '2021-08-02T06:40:40.646Z',
  subscription_id: 'subscription',
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  high_availability: false,
  integration_source: null,
}

function mockRolesApis() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: project,
  })
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const key = new URL(request.url).searchParams.get('key')

      if (key === 'max-connections') {
        return HttpResponse.json<[{ max_connections: number }]>([{ max_connections: 60 }])
      }

      return HttpResponse.json<[]>([])
    },
  })
}

describe('RolesList URL history', () => {
  beforeEach(() => {
    mockRolesApis()
  })

  it('pushes history when the create panel opens', async () => {
    const onUrlUpdate = vi.fn()
    customRender(<RolesList />, {
      nuqs: { hasMemory: true, rateLimitFactor: 1, onUrlUpdate },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Add role' }))

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const [update] = onUrlUpdate.mock.calls.at(-1)!
    expect(update.queryString).toContain('new=true')
    expect(update.options.history).toBe('push')
  })

  it('replaces history when a missing role id is cleared', async () => {
    const onUrlUpdate = vi.fn()
    customRender(<RolesList />, {
      nuqs: {
        hasMemory: true,
        rateLimitFactor: 1,
        onUrlUpdate,
        searchParams: '?delete=999',
      },
    })

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const [update] = onUrlUpdate.mock.calls.at(-1)!
    expect(update.queryString).not.toContain('delete=')
    expect(update.options.history).toBe('replace')
  })
})
