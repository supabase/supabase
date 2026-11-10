import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { beforeEach, describe, expect, it } from 'vitest'

import { SidebarIssueIndicator } from './SidebarIssueIndicator'
import { BannedIPKeys } from '@/data/banned-ips/keys'
import { lintKeys } from '@/data/lint/keys'
import type { Lint } from '@/data/lint/lint-query'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const makeLint = (category: Lint['categories'][number], level: Lint['level']): Lint => ({
  name: (
    {
      HEALTH: 'instance_db_down',
      PERFORMANCE: 'unused_index',
      SECURITY: 'rls_disabled_in_public',
    } as const
  )[category],
  title: 'Project finding',
  level,
  facing: 'EXTERNAL',
  categories: [category],
  description: 'Project finding',
  detail: 'Project finding',
  remediation: 'https://supabase.com/docs',
  metadata: { type: 'table', name: 'posts', schema: 'public' },
  cache_key: 'finding',
})

function renderIndicator(routeKey: 'issues' | 'advisors' = 'issues') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  customRender(
    <FeatureFlagContext.Provider value={{ configcat: { healthAdvisor: true }, posthog: {} }}>
      <a href={`/project/default/${routeKey}`}>
        <span>{routeKey === 'issues' ? 'Issues' : 'Advisors'}</span>
        <SidebarIssueIndicator routeKey={routeKey} />
      </a>
    </FeatureFlagContext.Provider>,
    { queryClient }
  )
  return queryClient
}

describe('sidebar issue indicator', () => {
  beforeEach(() => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: {
        cloud_provider: 'AWS',
        connectionString: 'postgresql://localhost:5432/postgres',
        db_host: 'localhost',
        high_availability: false,
        id: 1,
        inserted_at: '2026-01-01',
        integration_source: null,
        is_branch_enabled: false,
        is_physical_backups_enabled: false,
        name: 'Project',
        organization_id: 1,
        ref: 'default',
        region: 'us-east-1',
        restUrl: 'https://default.supabase.co',
        status: 'ACTIVE_HEALTHY',
        subscription_id: 'subscription-1',
        updated_at: '2026-01-01',
      } satisfies ProjectDetail,
    })
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/run-lints', response: [] })
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/network-bans/retrieve',
      response: { banned_ipv4_addresses: [] },
    })
    addAPIMock({
      method: 'post',
      path: '/v2/projects/:ref/advisors/run',
      response: { data: { type: 'project_advisors', attributes: { lints: [] } } },
    })
  })

  it('announces performance-only warnings on the Issues link', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/run-lints',
      response: [makeLint('PERFORMANCE', 'WARN')],
    })
    renderIndicator()

    expect(await screen.findByRole('status')).toHaveTextContent('Warning issues')
    expect(screen.getByRole('link', { name: 'Issues Warning issues' })).toHaveAttribute(
      'href',
      '/project/default/issues'
    )
  })

  it('announces health-only critical issues on the Issues link', async () => {
    addAPIMock({
      method: 'post',
      path: '/v2/projects/:ref/advisors/run',
      response: {
        data: { type: 'project_advisors', attributes: { lints: [makeLint('HEALTH', 'ERROR')] } },
      },
    })
    renderIndicator()

    expect(await screen.findByRole('status')).toHaveTextContent('Critical issues')
    expect(screen.getByRole('link', { name: 'Issues Critical issues' })).toBeInTheDocument()
  })

  it('does not announce warning or critical status for informational issues', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/run-lints',
      response: [makeLint('PERFORMANCE', 'INFO')],
    })
    const queryClient = renderIndicator()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))

    expect(screen.getByRole('link', { name: 'Issues' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps Advisors on legacy lint checks without requesting Issues health or signal checks', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/run-lints',
      response: [makeLint('SECURITY', 'ERROR')],
    })
    const queryClient = renderIndicator('advisors')
    await waitFor(() =>
      expect(queryClient.getQueryState(lintKeys.lint('default'))?.status).toBe('success')
    )

    expect(screen.getByRole('link', { name: 'Advisors' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(queryClient.getQueryState(lintKeys.healthLints('default'))).toBeUndefined()
    expect(queryClient.getQueryState(BannedIPKeys.list('default'))).toBeUndefined()
  })
})
