import { createRootRoute, createRoute } from '@tanstack/react-router'
import { act, waitFor } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { QueryInsightsTable } from './QueryInsightsTable'
import { NuqsAdapter } from '@/lib/nuqs-tanstack-adapter'
import { createTestRouter, customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

function createQueryInsightsRouter(initialEntry: string) {
  const rootRoute = createRootRoute()
  const queryInsightsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/project/$ref/observability/query-insights',
  })
  const postgresLogsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/project/$ref/logs/postgres-logs',
  })

  return createTestRouter(
    initialEntry,
    rootRoute.addChildren([queryInsightsRoute, postgresLogsRoute])
  )
}

function mockProjectEndpoint() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      cloud_provider: 'AWS',
      db_host: 'db.default.supabase.co',
      high_availability: false,
      id: 1,
      inserted_at: '2026-01-01T00:00:00Z',
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
      updated_at: '2026-01-01T00:00:00Z',
      connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
    },
  })
}

describe('QueryInsightsTable route change handling', () => {
  it('clears selected query on pathname change without mutating destination or history search params', async () => {
    mockProjectEndpoint()
    const onCurrentSelectQuery = vi.fn()
    const router = createQueryInsightsRouter(
      '/project/default/observability/query-insights?search=select'
    )
    await router.load()

    customRender(
      <NuqsAdapter>
        <QueryInsightsTable
          data={[]}
          isLoading={false}
          currentSelectedQuery="SELECT 1"
          onCurrentSelectQuery={onCurrentSelectQuery}
        />
      </NuqsAdapter>,
      { router }
    )

    // Same pathname with updated search params should not reset selection
    await act(async () => {
      await router.navigate({
        to: '/project/$ref/observability/query-insights',
        params: { ref: 'default' },
        search: { search: 'select', sort: 'calls' } as never,
      })
    })

    expect(onCurrentSelectQuery).not.toHaveBeenCalled()
    expect(router.state.location.search).toEqual({ search: 'select', sort: 'calls' })

    // Navigating to a different pathname should clear selection without clobbering destination search params
    await act(async () => {
      await router.navigate({
        to: '/project/$ref/logs/postgres-logs',
        params: { ref: 'default' },
        search: { search: 'from-logs' } as never,
      })
    })

    await waitFor(() => expect(onCurrentSelectQuery).toHaveBeenCalledWith(null))
    expect(router.state.location.search).toEqual({ search: 'from-logs' })

    // Navigating back preserves the previous history entry's search params
    await act(async () => {
      router.history.back()
      await router.load()
    })

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/project/default/observability/query-insights')
    )
    expect(router.state.location.search).toEqual({ search: 'select', sort: 'calls' })
  })
})
