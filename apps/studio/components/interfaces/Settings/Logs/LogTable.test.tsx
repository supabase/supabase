import { screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import type { LogQueryError } from './Logs.types'
import { LogTable } from './LogTable'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectResponse = components['schemas']['ProjectDetailResponse_Output']

describe('LogTable', () => {
  let projectRequested = false

  beforeEach(() => {
    projectRequested = false
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => {
        projectRequested = true
        return HttpResponse.json<ProjectResponse>({
          id: 1,
          ref: 'default',
          organization_id: 1,
          name: 'Test Project',
          status: 'ACTIVE_HEALTHY',
          cloud_provider: 'AWS',
          region: 'us-east-1',
          db_host: 'db.default.supabase.co',
          restUrl: 'https://default.supabase.co/rest/v1/',
          inserted_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          subscription_id: 'sub_123',
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          high_availability: false,
          integration_source: null,
          connectionString: null,
        })
      },
    })
  })

  it('shows the error panel for an error body without an `errors` array', async () => {
    // What a thrown assertion error looks like once serialized by apiWrapper: no message, no
    // errors array. The wire shape doesn't match LogQueryError, hence the cast.
    const error = {
      error: { generatedMessage: false, code: 'ERR_ASSERTION', expected: true, operator: '==' },
      code: 500,
    } as unknown as LogQueryError

    customRender(<LogTable projectRef="default" data={[]} error={error} />)

    expect(screen.getByText('Error fetching logs')).toBeInTheDocument()
    // Let LogTable's project query settle before MSW handlers are reset.
    await waitFor(() => expect(projectRequested).toBe(true))
  })
})
