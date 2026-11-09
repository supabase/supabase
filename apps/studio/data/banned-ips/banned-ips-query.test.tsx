import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { useBannedIPsQuery, type IPData } from './banned-ips-query'
import { useAdvisorSignals } from '@/components/ui/AdvisorPanel/useAdvisorSignals'
import { useProjectDetailQuery, type ProjectDetail } from '@/data/projects/project-detail-query'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  IS_PLATFORM: true,
}))

const PROJECT: ProjectDetail = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres:password@db.default.supabase.co:5432/postgres',
  db_host: 'db.default.supabase.co',
  dbVersion: 'supabase-postgres-15.1.0',
  high_availability: false,
  id: 1,
  infra_compute_size: 'micro',
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Test project',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://default.supabase.co',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const BANNED_IPS: IPData = { banned_ipv4_addresses: ['203.0.113.10'] }

const mockBannedIPs = () => {
  const requests: string[] = []
  addAPIMock({
    method: 'post',
    path: '/v1/projects/:ref/network-bans/retrieve',
    response: ({ request }) => {
      requests.push(request.url)
      return HttpResponse.json<IPData>(BANNED_IPS)
    },
  })
  return requests
}

describe('useBannedIPsQuery', () => {
  test.each([
    { name: 'v3', cloud_provider: 'AWS_K8S', high_availability: false },
    { name: 'HA', cloud_provider: 'AWS', high_availability: true },
    { name: 'v3 HA', cloud_provider: 'AWS_K8S', high_availability: true },
  ])('does not retrieve bans for $name with Settings and Advisor enabled', async (project) => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.json<ProjectDetail>({ ...PROJECT, ...project }),
    })
    const requests = mockBannedIPs()
    const { result } = customRenderHook(() => ({
      project: useProjectDetailQuery({ ref: 'default' }),
      settings: useBannedIPsQuery({ projectRef: 'default' }),
      advisor: useAdvisorSignals({ projectRef: 'default' }),
    }))

    await waitFor(() => expect(result.current.project.isSuccess).toBe(true))
    expect(result.current.settings.fetchStatus).toBe('idle')
    expect(result.current.advisor.data).toEqual([])
    expect(requests).toEqual([])

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await act(async () => {
        await expect(result.current.settings.refetch({ throwOnError: true })).rejects.toThrow()
      })
      expect(requests).toEqual([])
    } finally {
      consoleError.mockRestore()
    }
  })

  test('shares banned IPs with Advisor on a supported project', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.json<ProjectDetail>(PROJECT),
    })
    const requests = mockBannedIPs()
    const { result } = customRenderHook(() => ({
      settings: useBannedIPsQuery({ projectRef: 'default' }),
      advisor: useAdvisorSignals({ projectRef: 'default' }),
    }))

    await waitFor(() => expect(result.current.advisor.data).toHaveLength(1))
    expect(result.current.settings.data).toEqual(BANNED_IPS)
    expect(requests).toHaveLength(1)
  })

  test('waits for project details before retrieving bans', async () => {
    const { promise, resolve } = Promise.withResolvers<void>()
    let hasRequestedProject = false
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: async () => {
        hasRequestedProject = true
        await promise
        return HttpResponse.json<ProjectDetail>(PROJECT)
      },
    })
    const requests = mockBannedIPs()
    const { result } = customRenderHook(() => useBannedIPsQuery({ projectRef: 'default' }))

    try {
      await waitFor(() => expect(hasRequestedProject).toBe(true))
      expect(result.current.fetchStatus).toBe('idle')
      expect(requests).toEqual([])
    } finally {
      resolve()
    }

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(requests).toHaveLength(1)
  })

  test('waits for project details to recover before retrieving bans', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Project unavailable' }, { status: 500 }),
    })
    const requests = mockBannedIPs()
    const { result } = customRenderHook(() => ({
      project: useProjectDetailQuery({ ref: 'default' }),
      bans: useBannedIPsQuery({ projectRef: 'default' }),
    }))

    await waitFor(() => expect(result.current.project.isError).toBe(true))
    expect(result.current.bans.fetchStatus).toBe('idle')
    expect(requests).toEqual([])

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.json<ProjectDetail>(PROJECT),
    })
    await act(() => result.current.project.refetch())

    await waitFor(() => expect(result.current.bans.isSuccess).toBe(true))
    expect(result.current.bans.data).toEqual(BANNED_IPS)
    expect(requests).toHaveLength(1)
  })

  test('keeps bans visible when project details fail to refresh with cached supported data', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () => HttpResponse.json<ProjectDetail>(PROJECT),
    })
    mockBannedIPs()
    const { result } = customRenderHook(() => ({
      project: useProjectDetailQuery({ ref: 'default' }),
      bans: useBannedIPsQuery({ projectRef: 'default' }),
      advisor: useAdvisorSignals({ projectRef: 'default' }),
    }))

    await waitFor(() => expect(result.current.advisor.data).toHaveLength(1))
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Project unavailable' }, { status: 500 }),
    })
    await act(async () => {
      const projectResult = await result.current.project.refetch()
      expect(projectResult.isError).toBe(true)
    })
    expect(result.current.bans.data).toEqual(BANNED_IPS)
    expect(result.current.advisor.data).toHaveLength(1)
  })

  test.each([
    { projectRef: 'default', enabled: false },
    { projectRef: undefined, enabled: true },
  ])('does not fetch with $projectRef and enabled=$enabled', ({ projectRef, enabled }) => {
    const { result } = customRenderHook(() => useBannedIPsQuery({ projectRef }, { enabled }))

    expect(result.current.fetchStatus).toBe('idle')
  })

  test('checks the requested project when navigating from supported to v3', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: ({ params }) =>
        HttpResponse.json<ProjectDetail>({
          ...PROJECT,
          ref: String(params.ref),
          cloud_provider: params.ref === 'v3' ? 'AWS_K8S' : 'AWS',
        }),
    })
    const requests = mockBannedIPs()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    let projectRef = 'default'
    const { result, rerender } = customRenderHook(
      () => ({
        project: useProjectDetailQuery({ ref: projectRef }),
        bans: useBannedIPsQuery({ projectRef }),
        advisor: useAdvisorSignals({ projectRef }),
      }),
      { queryClient }
    )

    await waitFor(() => expect(result.current.bans.isSuccess).toBe(true))
    act(() => {
      projectRef = 'v3'
      rerender()
    })

    await waitFor(() => expect(result.current.project.data?.ref).toBe('v3'))
    expect(result.current.bans.fetchStatus).toBe('idle')
    expect(result.current.advisor.data).toEqual([])
    expect(requests).toHaveLength(1)
    expect(requests[0]).toContain('/projects/default/network-bans/retrieve')
  })
})
