import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UrlUpdateEvent } from 'nuqs/adapters/testing'
import { describe, expect, it, vi } from 'vitest'

import { UsageProjectName } from './UsageProjectName'
import { customRender } from '@/tests/lib/custom-render'

describe('UsageProjectName', () => {
  it('selects the project and clears the branch when clicked', async () => {
    const user = userEvent.setup()
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>()

    customRender(<UsageProjectName name="My project" projectRef="project-ref" />, {
      nuqs: { searchParams: { branchRef: 'branch-ref' }, hasMemory: true, onUrlUpdate },
    })

    await user.click(screen.getByRole('button', { name: 'My project' }))

    await waitFor(() => {
      const searchParams = onUrlUpdate.mock.lastCall?.[0].searchParams
      expect(searchParams?.get('projectRef')).toBe('project-ref')
      expect(searchParams?.has('branchRef')).toBe(false)
    })
  })

  it('renders plain text when the project is already selected', () => {
    customRender(
      <UsageProjectName
        name="My project"
        projectRef="project-ref"
        selectedProjectRef="project-ref"
      />
    )

    expect(screen.getByText('My project')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'My project' })).not.toBeInTheDocument()
  })

  it('stays clickable when a different project is selected', () => {
    customRender(
      <UsageProjectName name="My project" projectRef="project-ref" selectedProjectRef="other-ref" />
    )

    expect(screen.getByRole('button', { name: 'My project' })).toBeInTheDocument()
  })
})
