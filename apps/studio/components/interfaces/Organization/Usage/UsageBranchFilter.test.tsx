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

  it.each(['release-candidate-199', 'preview-ref-199'])(
    'finds a branch among 200 options by searching for %s and selects its project ref',
    async (search) => {
      const user = userEvent.setup()
      const onSelectBranch = vi.fn()
      const branches = Array.from({ length: 200 }, (_, index) =>
        createTestBranch({
          id: `branch-id-${index}`,
          name: `release-candidate-${index}`,
          project_ref: `preview-ref-${index}`,
        })
      )
      customRender(
        <UsageBranchFilter
          branchOptions={branches}
          projectRef="parent-ref"
          branchRef={null}
          onSelectBranch={onSelectBranch}
        />
      )

      await user.click(screen.getByLabelText('Filter by branch'))
      await user.type(await screen.findByPlaceholderText('Find branch...'), search)

      expect(screen.getAllByRole('option').length).toBeLessThan(200)
      expect(screen.getAllByRole('option')[0]).toHaveTextContent('release-candidate-199')
      await user.click(screen.getByRole('option', { name: 'release-candidate-199' }))

      expect(onSelectBranch).toHaveBeenCalledExactlyOnceWith('preview-ref-199')
      expect(screen.queryByPlaceholderText('Find branch...')).not.toBeInTheDocument()
    }
  )

  it('shows an empty state for an unmatched search and restores options when cleared', async () => {
    const user = userEvent.setup()
    const onSelectBranch = vi.fn()
    customRender(
      <UsageBranchFilter
        branchOptions={[mainBranch, previewBranch]}
        projectRef="parent-ref"
        branchRef={null}
        onSelectBranch={onSelectBranch}
      />
    )

    await user.click(screen.getByLabelText('Filter by branch'))
    const search = await screen.findByPlaceholderText('Find branch...')
    await user.type(search, 'nonexistent-branch')

    expect(await screen.findByText('No branches found')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(onSelectBranch).not.toHaveBeenCalled()

    await user.clear(search)

    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(screen.queryByText('No branches found')).not.toBeInTheDocument()
  })

  it('supports keyboard selection and Escape clears search before dismissing', async () => {
    const user = userEvent.setup()
    const onSelectBranch = vi.fn()
    customRender(
      <UsageBranchFilter
        branchOptions={[mainBranch, previewBranch]}
        projectRef="parent-ref"
        branchRef={null}
        onSelectBranch={onSelectBranch}
      />
    )

    await user.tab()
    expect(screen.getByLabelText('Filter by branch')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByPlaceholderText('Find branch...')).toHaveFocus()
    await user.keyboard('marvo{ArrowDown}{Enter}')

    expect(onSelectBranch).toHaveBeenCalledExactlyOnceWith('branch-ref')
    expect(screen.queryByPlaceholderText('Find branch...')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Filter by branch')).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(await screen.findByPlaceholderText('Find branch...')).toHaveFocus()
    await user.keyboard('main{Escape}')

    expect(screen.getByPlaceholderText('Find branch...')).toHaveValue('')
    expect(screen.getByPlaceholderText('Find branch...')).toHaveFocus()
    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(onSelectBranch).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')

    expect(screen.queryByPlaceholderText('Find branch...')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Filter by branch')).toHaveFocus()
    expect(onSelectBranch).toHaveBeenCalledTimes(1)
  })
})
