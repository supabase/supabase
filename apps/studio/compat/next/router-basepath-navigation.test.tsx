import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Link from './link'
import { useRouter } from './router'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

// The shims read NEXT_PUBLIC_BASE_PATH at module load, so it has to be set
// before the static imports above are evaluated.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_BASE_PATH = '/dashboard'
})

type ShimRouter = ReturnType<typeof useRouter>

async function renderWithRouter(ui: (shim: { current?: ShimRouter }) => React.ReactNode) {
  const shim: { current?: ShimRouter } = {}
  function Page() {
    shim.current = useRouter()
    return <>{ui(shim)}</>
  }
  const rootRoute = createRootRoute({ component: Outlet })
  const page = createRoute({
    getParentRoute: () => rootRoute,
    path: '/project/$ref',
    component: Page,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([page]),
    basepath: '/dashboard',
    history: createMemoryHistory({ initialEntries: ['/dashboard/project/default'] }),
    parseSearch,
    stringifySearch,
    isServer: false,
  })
  await router.load()
  const view = render(<RouterProvider router={router} />)
  return { router, shim, view }
}

const origin = window.location.origin

describe('next/link + next/router shims with a configured basePath', () => {
  it('renders a same-origin URL outside the basePath as a plain anchor to the full URL', async () => {
    const href = `${origin}/docs/guides/platform/manage-your-usage/compute`
    const { router, view } = await renderWithRouter(() => <Link href={href}>Compute Costs</Link>)
    try {
      const link = screen.getByRole('link', { name: 'Compute Costs' })
      expect(link).toHaveAttribute('href', href)
      const navigate = vi.spyOn(router, 'navigate')
      fireEvent.click(link)
      expect(navigate).not.toHaveBeenCalled()
      expect(router.state.location.href).toBe('/project/default')
    } finally {
      view.unmount()
    }
  })

  it('keeps basepath-relative and basePath-prefixed links internal', async () => {
    const { view } = await renderWithRouter(() => (
      <>
        <Link href="/project/abc">relative</Link>
        <Link href="/dashboard/project/abc">prefixed</Link>
        <Link href={`${origin}/dashboard/project/abc`}>absolute</Link>
      </>
    ))
    try {
      for (const name of ['relative', 'prefixed', 'absolute']) {
        expect(screen.getByText(name).closest('a')).toHaveAttribute(
          'href',
          '/dashboard/project/abc'
        )
      }
    } finally {
      view.unmount()
    }
  })

  it.each([
    ['same-origin outside the basePath', `${origin}/docs/guides`],
    ['cross-origin', 'https://example.com/docs#install'],
  ])('push() of a %s URL does a document navigation to the original URL', async (_, url) => {
    const { router, shim, view } = await renderWithRouter(() => null)
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(undefined)
    try {
      await act(async () => {
        await shim.current!.push(url)
      })
      expect(navigate).toHaveBeenCalledWith({ href: url, reloadDocument: true, replace: undefined })
      await act(async () => {
        await shim.current!.replace(url)
      })
      expect(navigate).toHaveBeenLastCalledWith({ href: url, reloadDocument: true, replace: true })
    } finally {
      view.unmount()
    }
  })

  it('push() of an external URL leaves the client-side location alone', async () => {
    // Unmocked: TanStack hands it to `window.location` (a no-op in jsdom)
    // instead of resolving it as a path segment (`/project/default/https:/...`).
    const { router, shim, view } = await renderWithRouter(() => null)
    try {
      await act(async () => {
        await shim.current!.push(`${origin}/docs/guides`)
      })
      expect(router.state.location.href).toBe('/project/default')
    } finally {
      view.unmount()
    }
  })

  it('push() of an internal path stays a client-side navigation', async () => {
    const { router, shim, view } = await renderWithRouter(() => null)
    const navigate = vi.spyOn(router, 'navigate')
    try {
      await act(async () => {
        await shim.current!.push(`${origin}/dashboard/project/other?tab=1`)
      })
      expect(navigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/project/other', search: { tab: '1' } })
      )
      expect(router.state.location.pathname).toBe('/project/other')
    } finally {
      view.unmount()
    }
  })

  it('push() resolves a protocol-relative URL so TanStack does not block it', async () => {
    const { router, shim, view } = await renderWithRouter(() => null)
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(undefined)
    try {
      await act(async () => {
        await shim.current!.push('//example.com/docs')
      })
      expect(navigate).toHaveBeenCalledWith({
        href: `${window.location.protocol}//example.com/docs`,
        reloadDocument: true,
        replace: undefined,
      })
    } finally {
      view.unmount()
    }
  })
})
