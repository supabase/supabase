// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

// Each navigation links a new commit promise to the previous one, and the chain is only
// resolved once a load completes without being superseded. Resolving a long chain must not
// recurse once per link (see patches/@tanstack__router-core@*.patch).
describe('router commit promise chain', () => {
  it('resolves a long chain of superseded navigations without overflowing the stack', async () => {
    const rootRoute = createRootRoute()
    const itemRoute = createRoute({ getParentRoute: () => rootRoute, path: '/items/$id' })
    const router = createRouter({
      routeTree: rootRoute.addChildren([itemRoute]),
      history: createMemoryHistory({ initialEntries: ['/items/0'] }),
    })
    await router.load()

    const navigations: Promise<void>[] = []
    for (let i = 1; i <= 50_000; i++) {
      navigations.push(router.navigate({ href: `/items/${i % 2}`, replace: true }))
    }

    await expect(Promise.all(navigations)).resolves.toBeDefined()
    expect(router.state.location.pathname).toBe('/items/0')
  }, 20_000)
})
