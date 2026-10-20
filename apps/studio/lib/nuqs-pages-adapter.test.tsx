import { act, renderHook } from '@testing-library/react'
import { parseAsString, useQueryState } from 'nuqs'
import { createContext, useContext, useState, type PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NuqsAdapter } from './nuqs-pages-adapter'

type RouteHandler = (...args: unknown[]) => void

// Just enough of the pages router singleton for the adapter: its events, and
// `push`/`replace` that stay pending until the test lands them, so a test can
// slip a Back or a foreign navigation in before nuqs' own update settles.
const fakeRouter = vi.hoisted(() => {
  const handlers = new Map<string, Set<RouteHandler>>()
  const inFlight: Array<{ as: string; resolve: (value: boolean) => void }> = []
  const navigate = vi.fn((as: string) => {
    emit('routeChangeStart', as)
    return new Promise<boolean>((resolve) => inFlight.push({ as, resolve }))
  })
  function emit(type: string, ...args: unknown[]) {
    handlers.get(type)?.forEach((handler) => handler(...args))
  }
  return {
    basePath: '',
    events: {
      on: (type: string, handler: RouteHandler) => {
        handlers.set(type, (handlers.get(type) ?? new Set()).add(handler))
      },
      off: (type: string, handler: RouteHandler) => handlers.get(type)?.delete(handler),
    },
    emit,
    push: navigate,
    replace: navigate,
    inFlight,
  }
})

vi.mock('next/router', () => ({ default: fakeRouter }))
vi.mock('next/compat/router', () => ({ useRouter: () => useContext(FakeRouterContext) }))

type Query = Record<string, string>
const FakeRouterContext = createContext<{ query: Query }>({ query: {} })

let setRouterQuery: (query: Query) => void = () => {}

function Wrapper({ children }: PropsWithChildren) {
  const [query, setQuery] = useState<Query>(() =>
    Object.fromEntries(new URLSearchParams(location.search))
  )
  setRouterQuery = setQuery
  return (
    <FakeRouterContext.Provider value={{ query }}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </FakeRouterContext.Provider>
  )
}

const pathname = '/project/abc/editor'

// Something other than nuqs moved the router: Back/Forward, `router.push`, a redirect.
function foreignNavigation(as: string) {
  const url = new URL(as, location.origin)
  return {
    start: () => fakeRouter.emit('routeChangeStart', as),
    land: () => {
      history.replaceState(null, '', as)
      setRouterQuery(Object.fromEntries(url.searchParams))
      fakeRouter.emit('routeChangeComplete', as)
    },
  }
}

// Settle the adapter's own in-flight navigation the way Next would on success.
function landOwnNavigation() {
  const navigation = fakeRouter.inFlight.shift()
  if (!navigation) throw new Error('no nuqs navigation in flight')
  history.replaceState(null, '', navigation.as)
  setRouterQuery(Object.fromEntries(new URL(navigation.as, location.origin).searchParams))
  fakeRouter.emit('routeChangeComplete', navigation.as)
  navigation.resolve(true)
}

const flushNuqs = () => act(() => vi.advanceTimersByTimeAsync(100))

const renderSchema = () =>
  renderHook(() => useQueryState('schema', parseAsString), { wrapper: Wrapper })

describe('NuqsAdapter (pages router)', () => {
  beforeEach(() => {
    // nuqs throttles on the real `performance.now()`; only the flush timer needs faking.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    history.replaceState(null, '', `${pathname}?schema=a`)
    fakeRouter.push.mockClear()
  })

  afterEach(async () => {
    // Settle whatever a test left in flight so module state doesn't leak.
    while (fakeRouter.inFlight.length > 0) {
      await act(async () => fakeRouter.inFlight.shift()?.resolve(false))
    }
    vi.useRealTimers()
  })

  it('writes the search to the current path through the router', async () => {
    const { result } = renderSchema()
    expect(result.current[0]).toBe('a')

    act(() => {
      void result.current[1]('b')
    })
    expect(result.current[0]).toBe('b')
    await flushNuqs()

    expect(fakeRouter.replace).toHaveBeenCalledWith(`${pathname}?schema=b`, undefined, {
      scroll: false,
      shallow: true,
    })
    await act(async () => landOwnNavigation())
    expect(result.current[0]).toBe('b')
  })

  it('keeps the written value on screen until the router shows it', async () => {
    const { result, rerender } = renderSchema()
    act(() => {
      void result.current[1]('b')
    })
    await flushNuqs()

    // Any render in this window used to read the stale router query.
    rerender()
    expect(result.current[0]).toBe('b')

    await act(async () => landOwnNavigation())
    expect(result.current[0]).toBe('b')
  })

  it('follows the address bar when Back lands while the nuqs update is still resolving', async () => {
    const { result } = renderSchema()
    act(() => {
      void result.current[1]('b')
    })
    await flushNuqs()
    expect(fakeRouter.inFlight).toHaveLength(1)

    const back = foreignNavigation(`${pathname}?schema=a`)
    await act(async () => {
      back.start()
      back.land()
    })
    expect(result.current[0]).toBe('a')

    // The held update settling later must not bring `b` back.
    await act(async () => fakeRouter.inFlight.shift()?.resolve(false))
    expect(result.current[0]).toBe('a')
  })

  it('drops a flush that would land during a navigation it did not start', async () => {
    const { result } = renderSchema()
    const leave = foreignNavigation('/project/abc/storage/files')

    act(() => {
      void result.current[1]('b')
    })
    leave.start()
    await flushNuqs()
    expect(fakeRouter.replace).not.toHaveBeenCalled()

    // Once that navigation settles, the next write goes through as usual.
    await act(async () => leave.land())
    act(() => {
      void result.current[1]('c')
    })
    await flushNuqs()
    expect(fakeRouter.replace).toHaveBeenCalledWith(
      '/project/abc/storage/files?schema=c',
      undefined,
      {
        scroll: false,
        shallow: true,
      }
    )
  })

  it('does not treat its own navigation as foreign', async () => {
    const { result } = renderSchema()
    act(() => {
      void result.current[1]('b')
    })
    await flushNuqs()
    await act(async () => landOwnNavigation())

    // If the adapter had flagged its own routeChangeStart as a foreign
    // navigation, this second write would be dropped.
    act(() => {
      void result.current[1]('c')
    })
    await flushNuqs()
    expect(fakeRouter.replace).toHaveBeenLastCalledWith(`${pathname}?schema=c`, undefined, {
      scroll: false,
      shallow: true,
    })
  })
})
