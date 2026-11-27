import { createRootRoute, createRoute } from '@tanstack/react-router'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useRoutePattern } from '../useRoutePattern'
import { customRenderHook } from '@/tests/lib/custom-render'
import { renderRoute } from '@/tests/lib/route-render'

function Probe() {
  const pattern = useRoutePattern()
  return <output aria-label="pattern">{pattern}</output>
}

describe('useRoutePattern', () => {
  it('returns the matched leaf route pattern for dynamic routes', async () => {
    const route = createRoute({
      getParentRoute: () => createRootRoute(),
      path: '$id',
      component: Probe,
    })

    await renderRoute(route, {
      routeId: '/project/$ref/sql/$id',
      url: '/project/abc/sql/123',
    })

    expect(screen.getByLabelText('pattern')).toHaveTextContent('/project/$ref/sql/$id')
  })

  it('strips trailing slashes from index routes', async () => {
    const route = createRoute({
      getParentRoute: () => createRootRoute(),
      path: '/',
      component: Probe,
    })

    await renderRoute(route, {
      routeId: '/project/$ref/',
      url: '/project/abc',
    })

    expect(screen.getByLabelText('pattern')).toHaveTextContent('/project/$ref')
  })

  it('falls back to location.pathname outside a matched child route', () => {
    const { result } = customRenderHook(() => useRoutePattern(), {
      initialUrl: '/project/abc/database/tables?schema=public',
    })

    expect(result.current).toBe('/project/abc/database/tables')
  })
})
