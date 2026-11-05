import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { IssuesSection } from './IssuesSection'
import type { Lint } from '@/data/lint/lint-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const makeLint = (name: string, cacheKey: string, level: Lint['level'] = 'ERROR'): Lint => ({
  name: name as Lint['name'],
  title: name,
  level,
  facing: 'EXTERNAL',
  categories: ['SECURITY'],
  description: `${name} description`,
  detail: `${name} detail`,
  remediation: 'https://example.com/fix',
  metadata: { type: 'table', schema: 'public', name: cacheKey },
  cache_key: cacheKey,
})

const mockLints = (lints: Lint[]) =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/run-lints',
    response: lints as never,
  })

describe('homepage issues', () => {
  beforeEach(() => {
    // Lints only run for a healthy project
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: { ref: 'default', status: 'ACTIVE_HEALTHY' } as never,
    })
  })

  it('groups findings by check and links each card to its issue', async () => {
    mockLints([
      makeLint('rls_disabled_in_public', 'posts'),
      makeLint('rls_disabled_in_public', 'users'),
    ])
    customRender(<IssuesSection />)

    expect(await screen.findByText('1 open')).toBeInTheDocument()
    expect(screen.getByText(/2 tables/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'RLS Disabled in Public' })).toHaveAttribute(
      'href',
      '/project/default/issues/rls_disabled_in_public'
    )
    expect(screen.getByRole('link', { name: 'View all issues' })).toHaveAttribute(
      'href',
      '/project/default/issues'
    )
  })

  it('shows four cards but counts them all, so the row stays compact without hiding the total', async () => {
    mockLints(['a', 'b', 'c', 'd', 'e'].map((name) => makeLint(name, name, 'WARN')))
    customRender(<IssuesSection />)

    expect(await screen.findByText('5 open')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'd' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'e' })).not.toBeInTheDocument()
  })

  it('says so when there is nothing to fix', async () => {
    mockLints([])
    customRender(<IssuesSection />)

    expect(await screen.findByText('No open issues')).toBeInTheDocument()
  })

  it('does not run checks on a project that is still starting', async () => {
    let lintsRequested = false
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/run-lints',
      response: () => {
        lintsRequested = true
        return HttpResponse.json([]) as never
      },
    })
    customRender(<IssuesSection showEmptyState />)

    expect(await screen.findByText('No open issues')).toBeInTheDocument()
    expect(lintsRequested).toBe(false)
  })

  it('offers a retry when checks fail, rather than claiming there are no issues', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/run-lints',
      response: () => HttpResponse.json({ message: 'failed' }, { status: 500 }) as never,
    })
    customRender(<IssuesSection />)

    expect(
      await screen.findByRole('button', { name: 'Retry' }, { timeout: 5000 })
    ).toBeInTheDocument()
    expect(screen.queryByText('No open issues')).not.toBeInTheDocument()
  })
})
