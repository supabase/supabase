import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BranchDropdown } from './BranchDropdown'
import type { Branch } from '@/data/branches/branches-query'
import { createTestBranch } from '@/tests/lib/branch-test-utils'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const { mockSelectedProject } = vi.hoisted(() => ({ mockSelectedProject: vi.fn() }))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  IS_PLATFORM: true,
  useParams: () => ({ ref: 'paused-branch-ref' }),
}))

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: mockSelectedProject(), isPending: false }),
}))

describe('BranchDropdown', () => {
  beforeEach(() => {
    mockSelectedProject.mockReturnValue({
      ref: 'paused-branch-ref',
      status: 'INACTIVE',
      parent_project_ref: 'parent-ref',
      is_branch_enabled: true,
    })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/branches',
      response: () =>
        HttpResponse.json<Branch[]>([
          createTestBranch({
            id: 'main',
            name: 'main',
            is_default: true,
            project_ref: 'parent-ref',
          }),
          createTestBranch({ id: 'paused', name: 'paused', project_ref: 'paused-branch-ref' }),
        ]),
    })
  })

  it('links Manage branches to the parent project when the selected branch is paused', async () => {
    customRender(<BranchDropdown embedded />)

    const link = await screen.findByRole('link', { name: 'Manage branches' })
    expect(link).toHaveAttribute('href', '/project/parent-ref/branches')
  })
})
