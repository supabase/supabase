import { QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useProjectIssues } from './useProjectIssues'
import { BannedIPKeys } from '@/data/banned-ips/keys'
import { lintKeys } from '@/data/lint/keys'
import type { Lint } from '@/data/lint/lint-query'
import { projectKeys } from '@/data/projects/keys'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const project: ProjectDetail = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
  db_host: 'localhost',
  dbVersion: '15',
  high_availability: false,
  id: 1,
  infra_compute_size: 'micro',
  inserted_at: '2026-01-01',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Production',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://default.supabase.co',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01',
}

function renderIssues({
  enabled = true,
  health = false,
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
} = {}) {
  return renderHook(() => useProjectIssues({ projectRef: 'default', enabled }), {
    wrapper: ({ children }) => (
      <CustomWrapper queryClient={client}>
        <FeatureFlagContext.Provider value={{ configcat: { healthAdvisor: health }, posthog: {} }}>
          {children}
        </FeatureFlagContext.Provider>
      </CustomWrapper>
    ),
  })
}

describe('useProjectIssues', () => {
  beforeEach(() => {
    window.localStorage.clear()
    addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: project })
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/run-lints', response: [] })
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/network-bans/retrieve',
      response: { banned_ipv4_addresses: [] },
    })
  })
  afterEach(() => window.localStorage.clear())

  it('refreshes a ban that was resolved on the server', async () => {
    let banned = true
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/network-bans/retrieve',
      response: () =>
        HttpResponse.json<{ banned_ipv4_addresses: string[] }>({
          banned_ipv4_addresses: banned ? ['203.0.113.10'] : [],
        }),
    })
    const { result } = renderIssues()
    await waitFor(() => expect(result.current.issues).toHaveLength(1))
    banned = false
    await act(() => result.current.refetch())
    await waitFor(() => expect(result.current.issues).toEqual([]))
  })

  it.each(['bans', 'health'] as const)(
    'reports a failed %s check instead of success',
    async (source) => {
      addAPIMock({
        method: 'post',
        path:
          source === 'bans'
            ? '/v1/projects/:ref/network-bans/retrieve'
            : '/v2/projects/:ref/advisors/run',
        response: () =>
          HttpResponse.json<APIErrorBody>({ message: 'Check unavailable' }, { status: 500 }),
      })
      const { result } = renderIssues({ health: source === 'health' })
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Check unavailable')
      expect(result.current.isSuccess).toBe(false)
    }
  )

  it('waits for banned IP checks before declaring success', async () => {
    let resolveBans: (value: { banned_ipv4_addresses: string[] }) => void = () => {}
    const bans = new Promise<{ banned_ipv4_addresses: string[] }>((resolve) => {
      resolveBans = resolve
    })
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/network-bans/retrieve',
      response: async () => HttpResponse.json<{ banned_ipv4_addresses: string[] }>(await bans),
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderIssues({ client })
    await waitFor(() =>
      expect(client.getQueryState(lintKeys.lint('default'))?.status).toBe('success')
    )
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSuccess).toBe(false)
    resolveBans({ banned_ipv4_addresses: [] })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('waits for project eligibility even when lint results are cached', async () => {
    let resolveProject: (value: ProjectDetail) => void = () => {}
    const pendingProject = new Promise<ProjectDetail>((resolve) => {
      resolveProject = resolve
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: async () => HttpResponse.json<ProjectDetail>(await pendingProject),
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData<Lint[]>(lintKeys.lint('default'), [])
    const { result } = renderIssues({ client })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSuccess).toBe(false)
    resolveProject(project)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('reports project eligibility failures with cached lint results', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Project unavailable' }, { status: 500 }),
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData<Lint[]>(lintKeys.lint('default'), [])
    const { result } = renderIssues({ client })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Project unavailable')
    expect(result.current.isSuccess).toBe(false)
  })

  it('recovers a failed eligibility refresh when checks are rerun', async () => {
    let isProjectAvailable = false
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => {
        if (isProjectAvailable) return HttpResponse.json<ProjectDetail>(project)
        return HttpResponse.json<APIErrorBody>({ message: 'Project unavailable' }, { status: 500 })
      },
    })
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/network-bans/retrieve',
      response: { banned_ipv4_addresses: ['203.0.113.10'] },
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(projectKeys.detail('default'), project)
    client.setQueryData<Lint[]>(lintKeys.lint('default'), [])
    await client.invalidateQueries({ queryKey: projectKeys.detail('default') })
    const { result } = renderIssues({ client })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Project unavailable')
    isProjectAvailable = true
    await act(() => result.current.refetch())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isError).toBe(false)
    expect(result.current.issues).toHaveLength(1)
  })

  it('completes and refreshes on a provider without network bans', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: { ...project, high_availability: true },
    })
    const { result } = renderIssues()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await act(() => result.current.refetch())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('hides cached issues and starts no checks when disabled', () => {
    const client = new QueryClient()
    client.setQueryData(projectKeys.detail('default'), project)
    client.setQueryData<Lint[]>(lintKeys.lint('default'), [
      {
        name: 'rls_disabled_in_public',
        title: 'RLS disabled',
        level: 'ERROR',
        facing: 'EXTERNAL',
        categories: ['SECURITY'],
        description: 'RLS disabled',
        detail: 'RLS disabled',
        remediation: 'https://supabase.com/docs',
        cache_key: 'rls',
        metadata: { type: 'table', name: 'accounts', schema: 'public' },
      },
    ])
    client.setQueryData(BannedIPKeys.list('default'), { banned_ipv4_addresses: ['203.0.113.10'] })
    const { result } = renderIssues({ client, enabled: false })
    expect(result.current.issues).toEqual([])
    expect(result.current.isFetching).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })
})
