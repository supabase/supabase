import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { IssuesSection } from './IssuesSection'
import { lintKeys } from '@/data/lint/keys'
import type { Lint, LINT_TYPES } from '@/data/lint/lint-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const makeLint = (name: LINT_TYPES, cacheKey: string, level: Lint['level'] = 'ERROR'): Lint => ({
  name,
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
    response: () =>
      HttpResponse.json<components['schemas']['GetProjectLintsResponse_Output']>(lints),
  })

describe('homepage issues', () => {
  beforeEach(() => {
    // Lints only run for a healthy project
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>({
          cloud_provider: 'AWS',
          connectionString: 'postgresql://localhost:5432/postgres',
          db_host: 'localhost',
          high_availability: false,
          id: 1,
          inserted_at: '2026-01-01T00:00:00Z',
          integration_source: null,
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          name: 'Project 1',
          organization_id: 1,
          ref: 'default',
          region: 'us-east-1',
          restUrl: 'http://localhost:3000',
          status: 'ACTIVE_HEALTHY',
          subscription_id: 'subscription-1',
          updated_at: '2026-01-01T00:00:00Z',
        }),
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
    mockLints(
      [
        'unindexed_foreign_keys',
        'auth_users_exposed',
        'auth_rls_initplan',
        'no_primary_key',
        'unused_index',
      ].map((name) => makeLint(name, name, 'WARN'))
    )
    customRender(<IssuesSection />)

    expect(await screen.findByText('5 open')).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href')?.startsWith('/project/default/issues/'))
    ).toHaveLength(4)
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
        return HttpResponse.json<components['schemas']['GetProjectLintsResponse_Output']>([])
      },
    })
    customRender(<IssuesSection showEmptyState />)

    expect(await screen.findByText('No open issues')).toBeInTheDocument()
    expect(lintsRequested).toBe(false)
  })

  it('shows the empty state instead of cached issues while a project is starting', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(lintKeys.lint('default'), [
      makeLint('rls_disabled_in_public', 'posts'),
    ])

    customRender(<IssuesSection showEmptyState />, { queryClient })

    expect(await screen.findByText('No open issues')).toBeInTheDocument()
    expect(screen.queryByText('1 open')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View all issues' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'RLS Disabled in Public' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ask Assistant/ })).not.toBeInTheDocument()
  })

  it('offers a retry when checks fail, rather than claiming there are no issues', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/run-lints',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'failed' }, { status: 500 }),
    })
    customRender(<IssuesSection />)

    expect(
      await screen.findByRole('button', { name: 'Retry' }, { timeout: 5000 })
    ).toBeInTheDocument()
    expect(screen.queryByText('No open issues')).not.toBeInTheDocument()
  })
})
