import { render, screen } from '@testing-library/react'
import { Command, CommandList } from 'ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BranchLink } from './BranchLink'
import { createTestBranch } from '@/tests/lib/branch-test-utils'

const { mockRouter } = vi.hoisted(() => ({
  mockRouter: { route: '/project/[ref]/editor', query: { ref: 'current-ref' } },
}))

vi.mock('next/router', () => ({ useRouter: () => mockRouter }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

const renderBranchLink = () =>
  render(
    <Command>
      <CommandList>
        <BranchLink
          branch={createTestBranch({ name: 'live', project_ref: 'live-ref' })}
          isSelected={false}
          onClose={vi.fn()}
        />
      </CommandList>
    </Command>
  )

describe('BranchLink', () => {
  beforeEach(() => {
    mockRouter.route = '/project/[ref]/editor'
  })

  it('keeps the current page when switching branches', () => {
    renderBranchLink()

    expect(screen.getByRole('link')).toHaveAttribute('href', '/project/live-ref/editor')
  })

  it.each(['/project/[ref]/branches', '/project/[ref]/branches/merge-requests'])(
    'links to the branch home page from %s',
    (route) => {
      mockRouter.route = route

      renderBranchLink()

      expect(screen.getByRole('link')).toHaveAttribute('href', '/project/live-ref')
    }
  )
})
