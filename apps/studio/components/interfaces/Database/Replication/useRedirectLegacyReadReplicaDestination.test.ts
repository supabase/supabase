// @vitest-environment jsdom
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useRedirectLegacyReadReplicaDestination } from './useRedirectLegacyReadReplicaDestination'
import { renderRoute } from '@/tests/lib/route-render'

const mockInfrastructureReadReplicas = vi.fn(() => true)

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({
    infrastructureReadReplicas: mockInfrastructureReadReplicas(),
  }),
}))

const RedirectHarness = () => {
  useRedirectLegacyReadReplicaDestination()
  return null
}

const renderPipelinesRoute = (search: string) =>
  renderRoute(
    createRoute({
      getParentRoute: () => createRootRoute(),
      path: 'project/$ref/database/pipelines',
      component: RedirectHarness,
    }),
    {
      routeId: '/project/$ref/database/pipelines',
      url: `/project/abc123/database/pipelines?${search}`,
    }
  )

describe('useRedirectLegacyReadReplicaDestination', () => {
  beforeEach(() => {
    mockInfrastructureReadReplicas.mockReturnValue(true)
  })

  test('redirects legacy Read Replica destinationType to Infrastructure', async () => {
    const { router } = await renderPipelinesRoute('destinationType=Read%20Replica')

    await waitFor(() => {
      expect(router.state.location.href).toBe(
        '/project/abc123/settings/infrastructure?addReplica=true'
      )
    })
    // replace: true keeps the legacy URL out of the history stack
    expect(router.history.length).toBe(1)
  })

  test('does not redirect for other destination types', async () => {
    const { router } = await renderPipelinesRoute('destinationType=BigQuery')

    expect(router.state.location.href).toBe(
      '/project/abc123/database/pipelines?destinationType=BigQuery'
    )
  })

  test('does not redirect when Infrastructure read replicas are disabled', async () => {
    mockInfrastructureReadReplicas.mockReturnValue(false)
    const { router } = await renderPipelinesRoute('destinationType=Read%20Replica')

    expect(router.state.location.pathname).toBe('/project/abc123/database/pipelines')
  })
})
