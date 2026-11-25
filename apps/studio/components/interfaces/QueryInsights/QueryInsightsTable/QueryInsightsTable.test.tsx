import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { act, waitFor } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { QueryInsightsTable } from './QueryInsightsTable'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { customRender } from '@/tests/lib/custom-render'
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

function createTestRouter(initialEntry: string) {
  const rootRoute = createRootRoute()
  const queryInsightsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/project/$ref/observability/query-insights',
  })
  const postgresLogsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/project/$ref/logs/postgres-logs',
  })

  return createRouter({
    routeTree: rootRoute.addChildren([queryInsightsRoute, postgresLogsRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    parseSearch,
    stringifySearch,
  })
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
  it('clears search and selected query when navigating to a different pathname, but not on search-only updates', async () => {
    mockProjectEndpoint()
    const onCurrentSelectQuery = vi.fn()
    const onUrlUpdate = vi.fn()
    const router = createTestRouter('/project/default/observability/query-insights?search=select')
    await router.load()

    customRender(
      <QueryInsightsTable
        data={[]}
        isLoading={false}
        currentSelectedQuery="SELECT 1"
        onCurrentSelectQuery={onCurrentSelectQuery}
      />,
      {
        router,
        nuqs: { searchParams: '?search=select', onUrlUpdate },
      }
    )

    onUrlUpdate.mockClear()

    // Same pathname with updated search params should not reset selection or search
    await act(async () => {
      await router.navigate({
        to: '/project/$ref/observability/query-insights',
        params: { ref: 'default' },
        search: { search: 'select', sort: 'calls' } as never,
      })
    })

    expect(onCurrentSelectQuery).not.toHaveBeenCalled()
    expect(onUrlUpdate).not.toHaveBeenCalled()

    // Navigating to a different pathname should clear selection and search query param
    await act(async () => {
      await router.navigate({
        to: '/project/$ref/logs/postgres-logs',
        params: { ref: 'default' },
      })
    })

    await waitFor(() => expect(onCurrentSelectQuery).toHaveBeenCalledWith(null))
    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          queryString: '',
        })
      )
    )
  })
})
