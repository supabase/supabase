import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'

import { AddNewSecretModal } from './AddNewSecretModal'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

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

mockAnimationsApi()

describe('AddNewSecretModal', () => {
  it('clears the entered secret when back closes the mounted modal', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: project,
    })

    let searchParams = '?new=true'
    let mounts = 0

    function Harness() {
      useEffect(() => {
        mounts += 1
      }, [])

      return <AddNewSecretModal />
    }

    const { rerender } = render(
      <CustomWrapper nuqs={{ hasMemory: true, rateLimitFactor: 1, searchParams }}>
        <Harness />
      </CustomWrapper>
    )

    const dialog = await screen.findByRole('dialog', { name: 'Add new secret' })
    const secret = dialog.querySelector('textarea[name="secret"]')
    if (!(secret instanceof HTMLTextAreaElement)) throw new Error('Secret field is missing')

    await userEvent.type(secret, 'super-secret')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Show secret value' }))
    expect(secret).toHaveValue('super-secret')
    const mountsWhileOpen = mounts

    searchParams = ''
    rerender(
      <CustomWrapper nuqs={{ hasMemory: true, rateLimitFactor: 1, searchParams }}>
        <Harness />
      </CustomWrapper>
    )

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Add new secret' })).not.toBeInTheDocument()
    )
    expect(mounts).toBe(mountsWhileOpen)

    searchParams = '?new=true'
    rerender(
      <CustomWrapper nuqs={{ hasMemory: true, rateLimitFactor: 1, searchParams }}>
        <Harness />
      </CustomWrapper>
    )

    const reopened = await screen.findByRole('dialog', { name: 'Add new secret' })
    const reopenedSecret = reopened.querySelector('textarea[name="secret"]')
    if (!(reopenedSecret instanceof HTMLTextAreaElement)) throw new Error('Secret field is missing')

    expect(reopenedSecret).toHaveValue('')
    expect(within(reopened).getByRole('button', { name: 'Show secret value' })).toBeInTheDocument()
    expect(mounts).toBe(mountsWhileOpen)
  })
})
