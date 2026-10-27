import { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DeleteSecretModal } from './DeleteSecretModal'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import type { VaultSecret } from '@/types'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']

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

const secret: VaultSecret = {
  id: 'secret-1',
  key_id: null,
  name: 'db',
  description: 'database password',
  secret: '',
  created_at: '2021-08-02T06:40:40.646Z',
  updated_at: '2021-08-02T06:40:40.646Z',
}

mockAnimationsApi()

function DeleteIdProbe() {
  const [id] = useQueryState('delete', parseAsString)
  return <p>{id ?? 'cleared'}</p>
}

describe('DeleteSecretModal', () => {
  it('clears the same id when forward restores it after a successful delete', async () => {
    let deleted = false

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: project,
    })
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: ({ request }) => {
        const key = new URL(request.url).searchParams.get('key')

        if (key === 'vault-secrets') {
          return HttpResponse.json(deleted ? [] : [secret])
        }

        deleted = true
        return HttpResponse.json([])
      },
    })

    const onUrlUpdate = vi.fn()

    function Harness() {
      const [queryClient] = useState(
        () =>
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
      )
      const [searchParams, setSearchParams] = useState('?delete=secret-1')

      return (
        <CustomWrapper
          queryClient={queryClient}
          nuqs={{ hasMemory: true, searchParams, onUrlUpdate }}
        >
          <DeleteIdProbe />
          <button
            type="button"
            tabIndex={0}
            onClick={() => setSearchParams('?delete=secret-1&restored=1')}
          >
            Restore forward
          </button>
          <DeleteSecretModal />
        </CustomWrapper>
      )
    }

    render(<Harness />)

    expect(
      await screen.findByRole('alertdialog', { name: 'Confirm to delete secret' })
    ).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(screen.getByText('cleared')).toBeInTheDocument())
    await waitFor(() =>
      expect(
        screen.queryByRole('alertdialog', { name: 'Confirm to delete secret' })
      ).not.toBeInTheDocument()
    )

    onUrlUpdate.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'Restore forward' }))

    await waitFor(() => expect(screen.getByText('cleared')).toBeInTheDocument())
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const update = onUrlUpdate.mock.calls.at(-1)?.[0]
    expect(update.queryString).not.toContain('delete=')
    expect(update.options.history).toBe('replace')
  })
})
