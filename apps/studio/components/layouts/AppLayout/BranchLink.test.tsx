import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { Command, CommandList } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { BranchLink } from './BranchLink'
import { createTestBranch } from '@/tests/lib/branch-test-utils'

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

const renderBranchLink = async (routePath: string, initialUrl: string) => {
  const rootRoute = createRootRoute()
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: routePath,
    component: () => (
      <Command>
        <CommandList>
          <BranchLink
            branch={createTestBranch({ name: 'live', project_ref: 'live-ref' })}
            isSelected={false}
            onClose={vi.fn()}
          />
        </CommandList>
      </Command>
    ),
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  })
  await router.load()
  return render(<RouterProvider router={router} />)
}

describe('BranchLink', () => {
  it('keeps the current page when switching branches', async () => {
    await renderBranchLink('/project/$ref/editor', '/project/current-ref/editor')

    expect(screen.getByRole('link')).toHaveAttribute('href', '/project/live-ref/editor')
  })

  it.each([
    ['/project/$ref/branches', '/project/current-ref/branches'],
    ['/project/$ref/branches/merge-requests', '/project/current-ref/branches/merge-requests'],
  ])('links to the branch home page from %s', async (routePath, url) => {
    await renderBranchLink(routePath, url)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/project/live-ref')
  })
})
