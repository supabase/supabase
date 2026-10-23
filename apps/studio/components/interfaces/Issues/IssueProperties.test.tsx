import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { screen } from '@testing-library/react'
import dayjs from 'dayjs'
import { beforeEach, describe, expect, it } from 'vitest'

import { IssueProperties } from './IssueProperties'
import type { Issue } from '@/data/issues/issue-schema'
import { listIssues, resetIssuesMock } from '@/data/issues/mock/issues-mock-api'
import { customRender } from '@/tests/lib/custom-render'

// The test setup mocks `useParams` from `common` to this project
const projectRef = 'default'

async function renderProperties(issue: Issue) {
  const rootRoute = createRootRoute({ component: Outlet })
  const issueRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/project/$ref/issues/$id',
    component: () => <IssueProperties issue={issue} />,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([issueRoute]),
    history: createMemoryHistory({ initialEntries: [`/project/${projectRef}/issues/${issue.id}`] }),
  })
  await router.load()
  customRender(<RouterProvider router={router} />)
}

describe('IssueProperties', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetIssuesMock(projectRef)
  })

  it('links a refiled check issue to the one before it', async () => {
    const { issues } = await listIssues({ projectRef, filters: { search: 'Data API error' } })
    const current = issues.find((issue) => issue.previous_issue_id !== null)!
    const earlier = issues.find((issue) => issue.id === current.previous_issue_id)!
    await renderProperties(current)

    const link = await screen.findByRole('link', {
      name: `Resolved ${dayjs(earlier.resolved_at).format('MMM D')}`,
    })
    expect(link).toHaveAttribute('href', `/project/${projectRef}/issues/${earlier.id}`)
    expect(link).toHaveAttribute('title', earlier.title)
  })

  it('shows no link for an issue filed the first time', async () => {
    const { issues } = await listIssues({ projectRef, filters: { search: 'RLS Disabled' } })
    await renderProperties(issues[0])
    expect(await screen.findByText('Affected')).toBeInTheDocument()
    expect(screen.queryByText('Previously')).not.toBeInTheDocument()
  })
})
