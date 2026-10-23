import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { parseAsString, useQueryState } from 'nuqs'
import { NuqsAdapter as NextNuqsAdapter } from 'nuqs/adapters/next/pages'
import { NuqsAdapter as ReactNuqsAdapter } from 'nuqs/adapters/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { usePanelQueryState } from './usePanelQueryState'
import { NuqsAdapter as TanStackNuqsAdapter } from '@/lib/nuqs-tanstack-adapter'
import { resetPanelHistoryForTests } from '@/lib/panel-history'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import {
  installNavigationDouble,
  uninstallNavigationDouble,
} from '@/tests/lib/panel-navigation-double'
import { routerMock } from '@/tests/lib/route-mock'

function PanelHarness({ onSearch }: { onSearch?: (value: string) => void }) {
  const [selectedId, setSelectedId] = usePanelQueryState(
    'show',
    parseAsString.withOptions({ history: 'push' })
  )
  const [nestedId, setNestedId] = usePanelQueryState(
    'edit',
    parseAsString.withOptions({ history: 'push' })
  )
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))

  return (
    <>
      <button type="button" tabIndex={0} onClick={() => setSelectedId('user-1')}>
        Open user
      </button>
      <button type="button" tabIndex={0} onClick={() => setSelectedId('user-2')}>
        Switch user
      </button>
      <button type="button" tabIndex={0} onClick={() => setNestedId('role-1')}>
        Open nested
      </button>
      <button
        type="button"
        tabIndex={0}
        onClick={() => {
          setSearch('ada')
          onSearch?.('ada')
        }}
      >
        Search
      </button>
      <button type="button" tabIndex={0} onClick={() => setSelectedId(null)}>
        Close user
      </button>
      <button type="button" tabIndex={0} onClick={() => setNestedId(null)}>
        Close nested
      </button>
      <button
        type="button"
        tabIndex={0}
        onClick={() => setSelectedId((current) => (current === 'user-1' ? 'user-2' : 'user-1'))}
      >
        Update by function
      </button>
      <p>{selectedId ?? 'closed'}</p>
      <p>{nestedId ?? 'nested-closed'}</p>
      <p>{search || 'no-search'}</p>
    </>
  )
}

describe('usePanelQueryState through the react history adapter', () => {
  beforeEach(() => {
    resetPanelHistoryForTests()
    installNavigationDouble()
    window.history.replaceState(null, '', '/project/default/auth/users')
  })

  afterEach(() => {
    resetPanelHistoryForTests()
    uninstallNavigationDouble()
  })

  it('replaces a row switch and closes back past the open, not to the previous row', async () => {
    render(
      <ReactNuqsAdapter>
        <PanelHarness />
      </ReactNuqsAdapter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open user' }))
    await waitFor(() => expect(window.location.search).toBe('?show=user-1'))
    const lengthAfterOpen = window.history.length

    fireEvent.click(screen.getByRole('button', { name: 'Switch user' }))
    await waitFor(() => expect(window.location.search).toBe('?show=user-2'))
    expect(window.history.length).toBe(lengthAfterOpen)
    expect(screen.getByText('user-2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close user' }))
    await waitFor(() => expect(window.location.search).toBe(''))
    // popstate follows the traversal, so nuqs state updates on the next task
    await waitFor(() => expect(screen.getByText('closed')).toBeInTheDocument())
  })

  it('replaces a function update while the panel is open', async () => {
    render(
      <ReactNuqsAdapter>
        <PanelHarness />
      </ReactNuqsAdapter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open user' }))
    await waitFor(() => expect(window.location.search).toBe('?show=user-1'))
    const lengthAfterOpen = window.history.length

    fireEvent.click(screen.getByRole('button', { name: 'Update by function' }))
    await waitFor(() => expect(window.location.search).toBe('?show=user-2'))
    expect(window.history.length).toBe(lengthAfterOpen)
  })

  it('keeps a search replace when the panel closes', async () => {
    render(
      <ReactNuqsAdapter>
        <PanelHarness />
      </ReactNuqsAdapter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open user' }))
    await waitFor(() => expect(window.location.search).toBe('?show=user-1'))
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(window.location.search).toContain('q=ada'))

    fireEvent.click(screen.getByRole('button', { name: 'Close user' }))
    await waitFor(() => expect(window.location.search).toBe('?q=ada'))
    expect(screen.getByText('closed')).toBeInTheDocument()
    expect(screen.getByText('ada')).toBeInTheDocument()
  })

  it('goes back through nested panels', async () => {
    render(
      <ReactNuqsAdapter>
        <PanelHarness />
      </ReactNuqsAdapter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open user' }))
    await waitFor(() => expect(window.location.search).toBe('?show=user-1'))
    fireEvent.click(screen.getByRole('button', { name: 'Open nested' }))
    await waitFor(() => expect(window.location.search).toBe('?show=user-1&edit=role-1'))

    fireEvent.click(screen.getByRole('button', { name: 'Close nested' }))
    await waitFor(() => expect(window.location.search).toBe('?show=user-1'))
    fireEvent.click(screen.getByRole('button', { name: 'Close user' }))
    await waitFor(() => expect(window.location.search).toBe(''))
  })
})

describe('usePanelQueryState through the Next pages adapter', () => {
  beforeEach(async () => {
    resetPanelHistoryForTests()
    installNavigationDouble()
    await routerMock.push('/project/default/auth/users')
    Reflect.set(window, 'next', { router: routerMock })
    window.history.replaceState(null, '', '/project/default/auth/users')
  })

  afterEach(() => {
    resetPanelHistoryForTests()
    uninstallNavigationDouble()
    Reflect.deleteProperty(window, 'next')
  })

  it('pushes an open and replaces a row switch', async () => {
    const push = routerMock.push.bind(routerMock)
    const replace = routerMock.replace.bind(routerMock)
    let pushes = 0
    let replaces = 0
    routerMock.push = ((...args: Parameters<typeof routerMock.push>) => {
      pushes += 1
      const result = push(...args)
      window.history.pushState(null, '', routerMock.asPath)
      return result
    }) as typeof routerMock.push
    routerMock.replace = ((...args: Parameters<typeof routerMock.replace>) => {
      replaces += 1
      const result = replace(...args)
      window.history.replaceState(null, '', routerMock.asPath)
      return result
    }) as typeof routerMock.replace

    render(
      <NextNuqsAdapter>
        <PanelHarness />
      </NextNuqsAdapter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open user' }))
    await waitFor(() => expect(routerMock.query.show).toBe('user-1'))
    expect(pushes).toBeGreaterThan(0)

    const pushesAfterOpen = pushes
    fireEvent.click(screen.getByRole('button', { name: 'Switch user' }))
    await waitFor(() => expect(routerMock.query.show).toBe('user-2'))
    expect(replaces).toBeGreaterThan(0)
    expect(pushes).toBe(pushesAfterOpen)

    fireEvent.click(screen.getByRole('button', { name: 'Close user' }))
    await waitFor(() => expect(window.location.search).toBe(''))
  })
})

describe('usePanelQueryState through the TanStack adapter', () => {
  let destroyHistory: (() => void) | undefined

  beforeEach(() => {
    resetPanelHistoryForTests()
    installNavigationDouble()
    window.history.replaceState(null, '', '/users')
  })

  afterEach(() => {
    destroyHistory?.()
    destroyHistory = undefined
    resetPanelHistoryForTests()
    uninstallNavigationDouble()
  })

  it('pushes an open, replaces a row switch, and goes back on close', async () => {
    const history = createBrowserHistory()
    destroyHistory = () => history.destroy()
    const rootRoute = createRootRoute()
    const routeTree = rootRoute.addChildren([
      createRoute({ getParentRoute: () => rootRoute, path: '/users' }),
    ])
    const router = createRouter({ routeTree, history, parseSearch, stringifySearch })
    await router.load()

    render(<PanelHarness />, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <RouterContextProvider router={router}>
          <TanStackNuqsAdapter>{children}</TanStackNuqsAdapter>
        </RouterContextProvider>
      ),
    })

    fireEvent.click(screen.getByRole('button', { name: 'Open user' }))
    await waitFor(() => expect(window.location.search).toBe('?show=user-1'))
    const lengthAfterOpen = window.history.length

    fireEvent.click(screen.getByRole('button', { name: 'Switch user' }))
    await waitFor(() => expect(window.location.search).toBe('?show=user-2'))
    expect(window.history.length).toBe(lengthAfterOpen)

    fireEvent.click(screen.getByRole('button', { name: 'Close user' }))
    await waitFor(() => expect(window.location.search).toBe(''))
    expect(screen.getByText('closed')).toBeInTheDocument()
  })
})
