import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { UsageBranchFilter } from './UsageBranchFilter'
import { createTestBranch } from '@/tests/lib/branch-test-utils'
import { customRender } from '@/tests/lib/custom-render'

const mainBranch = createTestBranch({
  id: 'main-id',
  name: 'main',
  project_ref: 'parent-ref',
  is_default: true,
})

const previewBranch = createTestBranch({ name: 'marvo-app-dev', project_ref: 'branch-ref' })

describe('UsageBranchFilter', () => {
  it('renders nothing when the project has no branches to filter by', () => {
    customRender(
      <UsageBranchFilter
        branchOptions={[]}
        projectRef="parent-ref"
        branchRef={null}
        onSelectBranch={vi.fn()}
      />
    )

    expect(screen.queryByLabelText('Filter by branch')).not.toBeInTheDocument()
  })

  it('selects a branch by its own project ref', async () => {
    const onSelectBranch = vi.fn()
    customRender(
      <UsageBranchFilter
        branchOptions={[mainBranch, previewBranch]}
        projectRef="parent-ref"
        branchRef={null}
        onSelectBranch={onSelectBranch}
      />
    )

    expect(screen.getByLabelText('Filter by branch')).toHaveTextContent('main')

    await userEvent.click(screen.getByLabelText('Filter by branch'))
    await userEvent.click(await screen.findByRole('option', { name: 'marvo-app-dev' }))

    expect(onSelectBranch).toHaveBeenCalledWith('branch-ref')
  })

  it('clears the branch filter when the main branch is selected', async () => {
    const onSelectBranch = vi.fn()
    customRender(
      <UsageBranchFilter
        branchOptions={[mainBranch, previewBranch]}
        projectRef="parent-ref"
        branchRef="branch-ref"
        onSelectBranch={onSelectBranch}
      />
    )

    expect(screen.getByLabelText('Filter by branch')).toHaveTextContent('marvo-app-dev')

    await userEvent.click(screen.getByLabelText('Filter by branch'))
    expect(await screen.findAllByRole('option')).toHaveLength(2)
    await userEvent.click(await screen.findByRole('option', { name: 'main' }))

    expect(onSelectBranch).toHaveBeenCalledWith(null)
  })

  it.each([
    { branchOptions: [mainBranch, previewBranch], label: 'main' },
    { branchOptions: [previewBranch], label: 'Main branch' },
  ])('falls back to $label when the selected ref is absent', ({ branchOptions, label }) => {
    customRender(
      <UsageBranchFilter
        branchOptions={branchOptions}
        projectRef="parent-ref"
        branchRef="deleted-branch-ref"
        onSelectBranch={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Filter by branch')).toHaveTextContent(label)
  })

  it('returns to the parent when the options contain only a preview branch', async () => {
    const onSelectBranch = vi.fn()
    customRender(
      <UsageBranchFilter
        branchOptions={[previewBranch]}
        projectRef="parent-ref"
        branchRef="branch-ref"
        onSelectBranch={onSelectBranch}
      />
    )

    expect(screen.getByLabelText('Filter by branch')).toHaveTextContent('marvo-app-dev')

    await userEvent.click(screen.getByLabelText('Filter by branch'))
    await userEvent.click(await screen.findByRole('option', { name: 'Main branch' }))

    expect(onSelectBranch).toHaveBeenCalledWith(null)
  })
})
