// Adapter that exposes a Next pages-router `events` API on top of
// TanStack Router's `router.subscribe`. Handles the event names studio +
// common + ui-patterns actually use today; expand the map as new ones
// surface.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRouter = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (...args: any[]) => void

type NextEventName =
  | 'routeChangeStart'
  | 'routeChangeComplete'
  | 'routeChangeError'
  | 'beforeHistoryChange'
  | 'hashChangeStart'
  | 'hashChangeComplete'

const EVENT_MAP: Partial<Record<NextEventName, string>> = {
  routeChangeStart: 'onBeforeLoad',
  routeChangeComplete: 'onResolved',
}

type EventsProxy = {
  on(event: NextEventName, handler: Handler): void
  off(event: NextEventName, handler: Handler): void
  emit(event: NextEventName, ...args: unknown[]): void
}

const proxyCache = new WeakMap<object, EventsProxy>()

function createProxy(router: AnyRouter): EventsProxy {
  const unsubByHandler = new Map<Handler, () => void>()

  return {
    on(event, handler) {
      const tsEvent = EVENT_MAP[event]
      if (!tsEvent) return
      const unsub = router.subscribe(tsEvent, () => handler())
      unsubByHandler.set(handler, unsub)
    },
    off(_event, handler) {
      const unsub = unsubByHandler.get(handler)
      if (unsub) {
        unsub()
        unsubByHandler.delete(handler)
      }
    },
    emit() {
      // no-op; Next exposes this but studio never calls it
    },
  }
}

export function getRouterEventsProxy(router: AnyRouter): EventsProxy {
  let proxy = proxyCache.get(router)
  if (!proxy) {
    proxy = createProxy(router)
    proxyCache.set(router, proxy)
  }
  return proxy
}
