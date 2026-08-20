import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { describe, expect, test, vi } from 'vitest'

import { SwitchToPreviewModal } from './SwitchToPreviewModal'
import type { components } from '@/data/api'
import type { Branch } from '@/data/branches/branches-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

type BranchUpdateResponse = components['schemas']['BranchUpdateResponse']

const PARENT_PROJECT_REF = 'parent-project-ref'
const BRANCH_PROJECT_REF = 'branch-project-ref'

const BRANCH: Branch = {
  created_at: '2026-01-01T00:00:00.000Z',
  id: '00000000-0000-0000-0000-000000000001',
  is_default: false,
  name: 'docs-local-staging',
  parent_project_ref: PARENT_PROJECT_REF,
  persistent: true,
  project_ref: BRANCH_PROJECT_REF,
  status: 'MIGRATIONS_PASSED',
  updated_at: '2026-01-01T00:00:00.000Z',
  with_data: false,
}

const mockBranchUpdate = () => {
  const requests: Array<{ branchRef: string | undefined; body: unknown }> = []

  addAPIMock({
    method: 'patch',
    path: '/v1/branches/:branch_id_or_ref',
    response: async ({ request, params }) => {
      requests.push({
        branchRef: params.branch_id_or_ref as string | undefined,
        body: await request.json(),
      })
      return HttpResponse.json<BranchUpdateResponse>({
        message: 'ok',
        workflow_run_id: 'workflow-run-1',
      })
    },
  })

  return requests
}

const renderModal = (overrides: { branch?: Branch; onClose?: () => void } = {}) => {
  const onClose = overrides.onClose ?? vi.fn()
  customRender(<SwitchToPreviewModal open branch={overrides.branch} onClose={onClose} />)
  return { onClose }
}

describe('SwitchToPreviewModal', () => {
  /**
   * The modal is opened from the branching overview, where the selected project is
   * the parent project and has no `parent_project_ref`. Both refs therefore have to
   * come from the branch itself — neither matches the ref in the URL.
   */
  test('switches the branch to preview using the refs on the branch', async () => {
    const requests = mockBranchUpdate()

    const { onClose } = renderModal({ branch: BRANCH })

    await userEvent.click(await screen.findByRole('button', { name: 'Switch to preview' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(requests).toEqual([{ branchRef: BRANCH_PROJECT_REF, body: { persistent: false } }])
    expect(toast.success).toHaveBeenCalledWith('Successfully updated branch')
  })

  test('surfaces the error and keeps the modal open when the update fails', async () => {
    addAPIMock({
      method: 'patch',
      path: '/v1/branches/:branch_id_or_ref',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Something exploded' }, { status: 500 }),
    })

    const { onClose } = renderModal({ branch: BRANCH })

    const confirm = await screen.findByRole('button', { name: 'Switch to preview' })
    await userEvent.click(confirm)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to update branch: Something exploded')
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(confirm).toBeEnabled()
  })

  test('disables the confirm button while the branch is unavailable', async () => {
    renderModal()

    expect(await screen.findByRole('button', { name: 'Switch to preview' })).toBeDisabled()
  })
})
