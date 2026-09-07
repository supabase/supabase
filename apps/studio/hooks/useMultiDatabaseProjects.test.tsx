import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/constants', () => ({ IS_PLATFORM: false }))

const PROJECTS_RESPONSE = [
  { ref: 'default', name: 'Default Project', db_host: 'db', db_port: 5432, status: 'ACTIVE_HEALTHY' },
  {
    ref: 'project-alpha',
    name: 'Project Alpha',
    db_host: 'db-alpha',
    db_port: 5432,
    status: 'ACTIVE_HEALTHY',
  },
]

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return Wrapper
}

function mockFetchOk(data: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

function mockFetchError(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

describe('useSelfHostedProjects', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('fetches projects from /api/platform/projects in self-hosted mode', async () => {
    mockFetchOk(PROJECTS_RESPONSE)
    const { useSelfHostedProjects } = await import('./useMultiDatabaseProjects')
    const { result } = renderHook(() => useSelfHostedProjects(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].ref).toBe('default')
    expect(result.current.data![1].ref).toBe('project-alpha')
    expect(result.current.data![1].name).toBe('Project Alpha')
  })

  it('returns error state when the API call fails', async () => {
    mockFetchError(500, { error: 'server error' })
    const { useSelfHostedProjects } = await import('./useMultiDatabaseProjects')
    const { result } = renderHook(() => useSelfHostedProjects(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })

  it('is disabled in platform mode', async () => {
    vi.doMock('@/lib/constants', () => ({ IS_PLATFORM: true }))
    const { useSelfHostedProjects } = await import('./useMultiDatabaseProjects')
    const { result } = renderHook(() => useSelfHostedProjects(), { wrapper: makeWrapper() })

    // fetchStatus is 'idle' when the query is disabled
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
