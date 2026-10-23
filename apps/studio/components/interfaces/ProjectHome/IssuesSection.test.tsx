import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IssuesSection } from './IssuesSection'
import { resetIssuesMock } from '@/data/issues/mock/issues-mock-api'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => ({ newChat: vi.fn() }),
}))

async function renderHome(showEmptyState = false) {
  const rootRoute = createRootRoute({ component: Outlet })
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/project/$ref',
    component: () => <IssuesSection showEmptyState={showEmptyState} />,
  })
  const issueRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/project/$ref/issues/$id',
    component: () => <h1>Issue details</h1>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute, issueRoute]),
    history: createMemoryHistory({ initialEntries: ['/project/default'] }),
  })
  await router.load()
  customRender(<RouterProvider router={router} />)
}

describe('homepage issues', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    window.localStorage.clear()
    resetIssuesMock('default')
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows grouped open issues and what they affect, with direct navigation', async () => {
    await renderHome()
    expect(await screen.findByText('12 open')).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href')?.includes('/issues/iss_'))
    ).toHaveLength(4)
    expect(screen.getByText(/3 tables/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View all issues' })).toHaveAttribute(
      'href',
      '/project/default/issues'
    )
    const issueLink = screen.getByRole('link', { name: 'RLS Disabled in Public' })
    expect(issueLink).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/project\/default\/issues\/iss_/)
    )
    await userEvent.click(issueLink)
    expect(await screen.findByRole('heading', { name: 'Issue details' })).toBeInTheDocument()
  })

  it('does not show seeded issues while the project is starting', async () => {
    await renderHome(true)
    expect(await screen.findByText('No open issues')).toBeInTheDocument()
    expect(screen.queryByText('12 open')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })
})
