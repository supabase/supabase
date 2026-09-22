// Adapter that exposes a Next pages-router `events` API on top of
// TanStack Router's `router.subscribe`. Handlers receive Next's
// signature: `(url: string, options: { shallow: boolean })`.
//
// TanStack's `RouterEvents` type (router-core/dist/esm/router.d.ts):
//   - onBeforeNavigate  — fires before the URL transition begins
//   - onBeforeLoad      — fires after navigation, before route loaders run
//   - onLoad            — fires while loaders run
//   - onResolved        — fires after route is fully resolved
//   - onBeforeRouteMount
//   - onRendered
//
// Each TanStack event payload carries
//   { fromLocation, toLocation, pathChanged, hrefChanged, hashChanged }
// — we forward `toLocation.href` as the URL arg.
//
// Known gap: Next's `routeChangeStart` lets handlers throw to cancel the
// navigation. TanStack's `subscribe` is fire-and-forget; cancellation
// requires `useBlocker` instead. `usePreventNavigationOnUnsavedChanges`
// relies on the throw-to-cancel pattern and will need migrating to
// `useBlocker` separately.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRouter = any
type Handler = (url: string, options: { shallow: boolean }) => void

type NextEventName =
  | 'routeChangeStart'
  | 'routeChangeComplete'
  | 'routeChangeError'
  | 'beforeHistoryChange'
  | 'hashChangeStart'
  | 'hashChangeComplete'

type TanStackEventName =
  | 'onBeforeNavigate'
  | 'onBeforeLoad'
  | 'onLoad'
  | 'onResolved'
  | 'onBeforeRouteMount'
  | 'onRendered'

type TanStackNavigationEvent = {
  type: TanStackEventName
  fromLocation?: { href: string; pathname: string; hash: string }
  toLocation: { href: string; pathname: string; hash: string }
  pathChanged: boolean
  hrefChanged: boolean
  hashChanged: boolean
}

type Mapping = {
  tsEvent: TanStackEventName
  // Optional filter — only fire for events matching the predicate (used
  // to scope `hashChange*` to hash-only navigations).
  filter?: (event: TanStackNavigationEvent) => boolean
}

const EVENT_MAP: Record<NextEventName, Mapping | undefined> = {
  // `onBeforeLoad` is closer to Next's `routeChangeStart` semantics than
  // `onBeforeNavigate` — both fire after the URL is committed but before
  // the page renders.
  routeChangeStart: { tsEvent: 'onBeforeLoad' },
  routeChangeComplete: { tsEvent: 'onResolved' },
  // TanStack surfaces errors via router state rather than a dedicated
  // lifecycle event. No-op for now; if a consumer needs this we can
  // subscribe to `router.__store` instead.
  routeChangeError: undefined,
  // Next fires `beforeHistoryChange` between `routeChangeStart` and the
  // pushState call — `onBeforeNavigate` is the closest TanStack stage.
  beforeHistoryChange: { tsEvent: 'onBeforeNavigate' },
  hashChangeStart: {
    tsEvent: 'onBeforeNavigate',
    filter: (e) => e.hashChanged && !e.pathChanged,
  },
  hashChangeComplete: {
    tsEvent: 'onResolved',
    filter: (e) => e.hashChanged && !e.pathChanged,
  },
}

type EventsProxy = {
  on(event: NextEventName, handler: Handler): void
  off(event: NextEventName, handler: Handler): void
  emit(event: NextEventName, ...args: unknown[]): void
}

const proxyCache = new WeakMap<object, EventsProxy>()

function createProxy(router: AnyRouter): EventsProxy {
  // Tracked per (event, handler) so the same handler can subscribe to
  // multiple Next events with independent unsubscribes.
  const unsubs = new Map<NextEventName, Map<Handler, () => void>>()

  return {
    on(event, handler) {
      const mapping = EVENT_MAP[event]
      if (!mapping) return

      const adapt = (e: TanStackNavigationEvent) => {
        if (mapping.filter && !mapping.filter(e)) return
        // Next handlers expect the destination URL string + a shallow
        // flag. We don't model shallow routing under TanStack, so it's
        // always `false`.
        handler(e.toLocation.href, { shallow: false })
      }

      const unsub = router.subscribe(mapping.tsEvent, adapt)
      let map = unsubs.get(event)
      if (!map) {
        map = new Map()
        unsubs.set(event, map)
      }
      map.set(handler, unsub)
    },
    off(event, handler) {
      const map = unsubs.get(event)
      if (!map) return
      const unsub = map.get(handler)
      if (unsub) {
        unsub()
        map.delete(handler)
      }
    },
    emit() {
      // Next exposes `events.emit` but nothing in studio calls it.
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
