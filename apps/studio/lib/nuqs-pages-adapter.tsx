import { useRouter } from 'next/compat/router'
import Router from 'next/router'
import {
  renderQueryString,
  unstable_createAdapterProvider,
  type unstable_AdapterInterface,
  type unstable_UpdateUrlFunction,
} from 'nuqs/adapters/custom'
import { useEffect, useMemo, useSyncExternalStore, type ComponentProps } from 'react'

// Custom nuqs adapter for the Next.js pages router.
//
// The stock `nuqs/adapters/next/pages` adapter leaves a flushed update in its
// queue until the next write, and only clears that queue on router events
// while no nuqs `router.replace` is in flight. Pressing Back inside that
// window leaves React state on the queued value while the address bar shows
// the previous one. The queue isn't reachable from nuqs' public API, so this
// adapter lets nuqs clear it on every flush (`autoResetQueueOnUpdate`) and
// instead keeps the written search as an optimistic value for exactly as long
// as its own router update is resolving. A navigation it didn't start —
// Back/Forward, a `router.push` from a modal, a redirect — discards that value
// and drops the flush that follows it, which is what the stock adapter's queue
// reset did.

type PendingWrite = { search: URLSearchParams; target: string }

// A nuqs write whose router update hasn't settled yet. Module-level, like the
// stock adapter's mutex: the adapter hook runs once per nuqs hook, and they all
// have to agree.
let pendingWrite: PendingWrite | null = null
let isForeignNavigationInFlight = false
const ownNavigations = new Map<string, number>()
const pendingWriteListeners = new Set<() => void>()

function setPendingWrite(next: PendingWrite | null) {
  pendingWrite = next
  pendingWriteListeners.forEach((listener) => listener())
}

function subscribeToPendingWrite(listener: () => void) {
  pendingWriteListeners.add(listener)
  return () => pendingWriteListeners.delete(listener)
}

const getPendingWrite = () => pendingWrite
const getServerPendingWrite = () => null

// Next runs the `as` it hands to router events through `new URL()` and prefixes
// `basePath` (except for `routeChangeError`, which strips it). Normalize the
// same way so the adapter recognizes its own navigations.
function toNavigationTarget(as: string, basePath: string): string {
  const { pathname, search, hash } = new URL(as, 'http://n')
  const path = `${pathname}${search}${hash}`
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) : path
}

function isOwnNavigation(as: string) {
  return ownNavigations.has(toNavigationTarget(as, Router.basePath))
}

function onRouteChangeStart(as: string) {
  if (isOwnNavigation(as)) return
  isForeignNavigationInFlight = true
  // The router is about to move somewhere nuqs didn't ask for; let it decide.
  if (pendingWrite !== null) setPendingWrite(null)
}

function onRouteChangeComplete(as: string) {
  if (isOwnNavigation(as)) return
  isForeignNavigationInFlight = false
}

function onRouteChangeError(_error: unknown, as: string) {
  onRouteChangeComplete(as)
}

const updateUrl: unstable_UpdateUrlFunction = (search, options) => {
  // Writing now would cancel the navigation (Next aborts the in-flight route),
  // bouncing the user back. The stock adapter drops these writes too, by
  // resetting its queue on `routeChangeStart`.
  if (isForeignNavigationInFlight) return

  const basePath = Router.basePath
  const pathname = basePath ? location.pathname.slice(basePath.length) : location.pathname
  const asPath = `${pathname}${renderQueryString(search)}${location.hash}`
  const target = toNavigationTarget(asPath, '')
  const write: PendingWrite = { search, target }

  ownNavigations.set(target, (ownNavigations.get(target) ?? 0) + 1)
  setPendingWrite(write)

  const navigate = options.history === 'push' ? Router.push : Router.replace
  navigate(asPath, undefined, { scroll: options.scroll, shallow: options.shallow }).finally(() => {
    const remaining = (ownNavigations.get(target) ?? 1) - 1
    if (remaining > 0) ownNavigations.set(target, remaining)
    else ownNavigations.delete(target)
    // Settled, so `router.query` reflects the outcome (or a newer write does).
    if (pendingWrite === write) setPendingWrite(null)
  })
}

function useNuqsNextPagesRouterAdapter(): unstable_AdapterInterface {
  const router = useRouter()
  const pending = useSyncExternalStore(
    subscribeToPendingWrite,
    getPendingWrite,
    getServerPendingWrite
  )

  const routerSearch = useMemo(() => {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(router?.query ?? {})) {
      if (typeof value === 'string') searchParams.set(key, value)
      else if (Array.isArray(value)) value.forEach((v) => searchParams.append(key, v))
    }
    return searchParams
    // router.query is a new object on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(router?.query)])

  return {
    searchParams: pending?.search ?? routerSearch,
    updateUrl,
    autoResetQueueOnUpdate: true,
  }
}

const Provider = unstable_createAdapterProvider(useNuqsNextPagesRouterAdapter)

export function NuqsAdapter(props: ComponentProps<typeof Provider>) {
  useEffect(() => {
    Router.events.on('routeChangeStart', onRouteChangeStart)
    Router.events.on('routeChangeComplete', onRouteChangeComplete)
    Router.events.on('routeChangeError', onRouteChangeError)
    return () => {
      Router.events.off('routeChangeStart', onRouteChangeStart)
      Router.events.off('routeChangeComplete', onRouteChangeComplete)
      Router.events.off('routeChangeError', onRouteChangeError)
    }
  }, [])

  return <Provider {...props} />
}
