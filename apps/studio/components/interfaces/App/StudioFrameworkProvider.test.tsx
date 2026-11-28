import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import { FrameworkImage, FrameworkLink, useFramework, useParams } from 'common'
import { Profiler } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { StudioFrameworkProvider } from './StudioFrameworkProvider'
import { renderRoute } from '@/tests/lib/route-render'

function ProbeComponent() {
  const params = useParams()
  const { pathname, asPath, push } = useFramework()

  return (
    <div>
      <span data-testid="pathname">{pathname}</span>
      <span data-testid="asPath">{asPath}</span>
      <span data-testid="ref">{params.ref}</span>
      <span data-testid="sortOrder">{params.sortOrder}</span>
      <button type="button" tabIndex={0} onClick={() => push('?sort-order=desc')}>
        Update query
      </button>
      <FrameworkLink href="/project/abc/editor?schema=public">Internal</FrameworkLink>
      <FrameworkLink href="https://supabase.com/docs">External</FrameworkLink>
      <FrameworkImage src="/img/example.png" alt="Example" fill priority />
    </div>
  )
}

const ProbeRoute = createRoute({
  getParentRoute: () => createRootRoute(),
  path: 'project/$ref/editor',
  component: ProbeComponent,
})

describe('StudioFrameworkProvider', () => {
  it('provides TanStack route pattern, asPath, params, Link, and Image through common FrameworkContext', async () => {
    await renderRoute(ProbeRoute, {
      routeId: '/project/$ref/editor',
      url: '/project/my-proj/editor?sort-order=asc&ref=ignored',
    })

    expect(screen.getByTestId('pathname')).toHaveTextContent('/project/[ref]/editor')
    expect(screen.getByTestId('asPath')).toHaveTextContent(
      '/project/my-proj/editor?sort-order=asc&ref=ignored'
    )
    // Route params take precedence over search params and kebab-case keys are camelCased
    expect(screen.getByTestId('ref')).toHaveTextContent('my-proj')
    expect(screen.getByTestId('sortOrder')).toHaveTextContent('asc')

    expect(screen.getByRole('link', { name: 'Internal' })).toHaveAttribute(
      'href',
      '/project/abc/editor?schema=public'
    )
    expect(screen.getByRole('link', { name: 'External' })).toHaveAttribute(
      'href',
      'https://supabase.com/docs'
    )

    const img = screen.getByAltText('Example')
    expect(img).toHaveAttribute('src', '/img/example.png')
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img).toHaveStyle({ position: 'absolute' })

    // Query-only push stays on the current route instead of navigating to '/'
    await act(async () => {
      screen.getByRole('button', { name: 'Update query' }).click()
    })
    expect(screen.getByTestId('pathname')).toHaveTextContent('/project/[ref]/editor')
    expect(screen.getByTestId('sortOrder')).toHaveTextContent('desc')
  })

  it('reports isReady only once the initial route load has committed', async () => {
    let finishLoading!: () => void
    const loading = new Promise<void>((resolve) => {
      finishLoading = resolve
    })

    function ReadyProbe() {
      const { isReady } = useFramework()
      return <span data-testid="isReady">{String(isReady)}</span>
    }

    const rootRoute = createRootRoute({
      shellComponent: ({ children }) => (
        <StudioFrameworkProvider>
          <ReadyProbe />
          {children}
        </StudioFrameworkProvider>
      ),
    })
    const editorRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: 'project/$ref/editor',
      beforeLoad: () => loading,
      component: () => null,
    })

    const router = createRouter({
      routeTree: rootRoute.addChildren([editorRoute]),
      history: createMemoryHistory({ initialEntries: ['/project/my-proj/editor'] }),
      defaultPendingMs: 0,
      defaultPendingMinMs: 0,
      defaultPendingComponent: () => null,
    })

    render(<RouterProvider router={router} />)
    expect(await screen.findByTestId('isReady')).toHaveTextContent('false')

    finishLoading()
    await waitFor(() => expect(screen.getByTestId('isReady')).toHaveTextContent('true'))
  })

  it('does not re-render StudioLink on router state ticks that leave pathname and search unchanged', async () => {
    const onLinkRender = vi.fn()

    function LinkProbe() {
      return (
        <Profiler id="studio-link" onRender={onLinkRender}>
          <FrameworkLink href="/project/abc/editor">Editor</FrameworkLink>
        </Profiler>
      )
    }

    const rootRoute = createRootRoute({
      shellComponent: ({ children }) => (
        <StudioFrameworkProvider>{children}</StudioFrameworkProvider>
      ),
    })
    const pageRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: 'project/$ref/editor',
      component: LinkProbe,
    })
    let finishPending!: () => void
    const pendingNav = new Promise<void>((resolve) => {
      finishPending = resolve
    })
    const otherRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: 'project/$ref/sql',
      beforeLoad: () => pendingNav,
      component: () => null,
    })

    const router = createRouter({
      routeTree: rootRoute.addChildren([pageRoute, otherRoute]),
      history: createMemoryHistory({ initialEntries: ['/project/my-proj/editor?tab=1'] }),
    })

    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('link', { name: 'Editor' })).toBeInTheDocument()

    const rendersAfterMount = onLinkRender.mock.calls.length

    let navPromise!: Promise<void>
    await act(async () => {
      navPromise = router.navigate({
        to: '/project/$ref/sql',
        params: { ref: 'my-proj' },
      })
      await Promise.resolve()
    })

    expect(onLinkRender.mock.calls.length).toBe(rendersAfterMount)

    await act(async () => {
      finishPending()
      await navPromise
    })
  })
})
