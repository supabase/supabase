/**
 * Each open push records `navigation.currentEntry.key` for that panel param.
 * Close goes back only when that key is still current and the rest of the url
 * is unchanged. Otherwise close replaces. Without the Navigation API, close
 * always replaces.
 *
 * A panel's own back records the destination url. Page guards compare that
 * url, so the exemption survives the awaits between popstate and the router.
 *
 * The store lives on `globalThis` so every copy of this module shares it.
 */

import {
  isHashOnlyChange,
  sameHistoryUrl,
  searchWithoutPanelParam,
  shouldGoBackOnDismiss,
  traverseRestoreDelta,
  type PanelEntryOwnership,
} from './panel-history.utils'

type PanelGuard = {
  shouldBlock: () => boolean
  onBlock: () => void
}

type RouterEventName =
  | 'routeChangeComplete'
  | 'routeChangeError'
  | 'routeChangeStart'
  | 'beforeHistoryChange'
  | 'hashChangeComplete'
  | 'hashChangeStart'

type RouterEvents = {
  on: (event: RouterEventName, handler: () => void) => void
  off: (event: RouterEventName, handler: () => void) => void
}

type PanelHistoryStore = {
  owned: Map<string, PanelEntryOwnership>
  armedKeys: Set<string>
  armTimers: Map<string, ReturnType<typeof setTimeout>>
  pendingBackEntryKey: string | null
  pendingDestinationHref: string | null
  pendingTimer: ReturnType<typeof setTimeout> | null
  restoring: boolean
  pendingGuard: PanelGuard | null
  expectedRestoreHref: string | null
  restoreGeneration: number
  restoreTimer: ReturnType<typeof setTimeout> | null
  listenersInstalled: boolean
  popStateListening: boolean
  navigationTarget: EventTarget | null
  routerEvents: RouterEvents | null
  guards: Set<PanelGuard>
}

type NavigationHistoryEntryLike = {
  key?: string
  index?: number
  url?: string | null
}

type NavigationLike = EventTarget & {
  currentEntry?: NavigationHistoryEntryLike | null
  entries?: () => NavigationHistoryEntryLike[]
  back?: () => unknown
}

const STORE_KEY = '__supabasePanelHistory'
const ARM_TIMEOUT_MS = 500
const PENDING_TIMEOUT_MS = 1000
const RESTORE_TIMEOUT_MS = 1000

type PanelHistoryGlobal = typeof globalThis & {
  [STORE_KEY]?: PanelHistoryStore
}

function createStore(): PanelHistoryStore {
  return {
    owned: new Map(),
    armedKeys: new Set(),
    armTimers: new Map(),
    pendingBackEntryKey: null,
    pendingDestinationHref: null,
    pendingTimer: null,
    restoring: false,
    pendingGuard: null,
    expectedRestoreHref: null,
    restoreGeneration: 0,
    restoreTimer: null,
    listenersInstalled: false,
    popStateListening: false,
    navigationTarget: null,
    routerEvents: null,
    guards: new Set(),
  }
}

function getStore() {
  const scope = globalThis as PanelHistoryGlobal
  const existing = scope[STORE_KEY]

  if (
    existing &&
    existing.owned instanceof Map &&
    existing.guards instanceof Set &&
    existing.armTimers instanceof Map
  ) {
    return existing
  }

  const created = createStore()
  scope[STORE_KEY] = created
  return created
}

export function readNavigation(): NavigationLike | null {
  if (typeof window === 'undefined') return null

  const candidate = Reflect.get(window, 'navigation')
  if (typeof candidate !== 'object' || candidate === null) return null
  if (typeof Reflect.get(candidate, 'addEventListener') !== 'function') return null

  return candidate as NavigationLike
}

function clearArmTimer(panelKey: string) {
  const store = getStore()
  const timer = store.armTimers.get(panelKey)

  if (timer === undefined) return

  clearTimeout(timer)
  store.armTimers.delete(panelKey)
}

function clearArmTimers() {
  const store = getStore()

  store.armTimers.forEach((timer) => {
    clearTimeout(timer)
  })
  store.armTimers.clear()
}

function captureOwnership(panelKey: string): PanelEntryOwnership | null {
  const entry = readNavigation()?.currentEntry
  const entryKey = typeof entry?.key === 'string' ? entry.key : null

  if (entryKey === null) return null

  const url = new URL(window.location.href)

  return {
    entryKey,
    pathname: url.pathname,
    searchWithoutPanel: searchWithoutPanelParam(url.search, panelKey),
    hash: url.hash,
  }
}

function readCurrentLocation() {
  const url = new URL(window.location.href)

  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    href: url.href,
  }
}

function onCurrentEntryChange(event: Event) {
  const navigationType = readEventString(event, 'navigationType')
  const store = getStore()

  if (navigationType !== 'push' || store.armedKeys.size === 0) return

  const params = new URLSearchParams(window.location.search)

  store.armedKeys.forEach((panelKey) => {
    if (!params.has(panelKey)) return

    const owned = captureOwnership(panelKey)
    if (owned) store.owned.set(panelKey, owned)
    store.armedKeys.delete(panelKey)
    clearArmTimer(panelKey)
  })
}

function readEventString(event: Event, key: string) {
  if (!(key in event)) return null

  const value = Reflect.get(event, key)
  if (typeof value !== 'string') return null

  return value
}

function readDestination(event: Event) {
  if (!('destination' in event)) return { index: null, url: null }

  const destination = Reflect.get(event, 'destination')
  if (typeof destination !== 'object' || destination === null) return { index: null, url: null }

  const index = Reflect.get(destination, 'index')
  const url = Reflect.get(destination, 'url')

  return {
    index: typeof index === 'number' ? index : null,
    url: typeof url === 'string' ? url : null,
  }
}

function destinationHref(delta: number) {
  const navigation = readNavigation()
  const index = navigation?.currentEntry?.index
  const entries = navigation?.entries?.()

  if (!entries || typeof index !== 'number') return null

  const target = entries[index + delta]
  if (typeof target?.url !== 'string') return null

  return target.url
}

function clearPendingTimer() {
  const store = getStore()

  if (store.pendingTimer === null) return

  clearTimeout(store.pendingTimer)
  store.pendingTimer = null
}

function clearPendingDestination() {
  const store = getStore()

  store.pendingDestinationHref = null
  clearPendingTimer()
}

function rememberPendingDestination(href: string | null) {
  if (!href) return

  const store = getStore()

  store.pendingDestinationHref = href
  clearPendingTimer()
  store.pendingTimer = setTimeout(() => {
    clearPendingDestination()
  }, PENDING_TIMEOUT_MS)
}

function clearRestoreTimer() {
  const store = getStore()

  if (store.restoreTimer === null) return

  clearTimeout(store.restoreTimer)
  store.restoreTimer = null
}

/** True when `url` is the destination of a panel back or restore still in flight. */
export function isPanelHistoryTraversalTo(url: string) {
  const href = getStore().pendingDestinationHref

  if (!href) return false

  return sameHistoryUrl(href, url, window.location.href)
}

function detachPopStateListener() {
  const store = getStore()

  if (!store.popStateListening || typeof window === 'undefined') return

  window.removeEventListener('popstate', onPopState, true)
  store.popStateListening = false
}

function finishRestore(blocked: PanelGuard | null) {
  const store = getStore()

  if (!store.restoring) return

  store.restoring = false
  store.pendingGuard = null
  store.expectedRestoreHref = null
  store.restoreGeneration += 1
  clearRestoreTimer()
  clearPendingDestination()
  detachPopStateListener()

  if (blocked) blocked.onBlock()
}

function scheduleRestore(guard: PanelGuard, delta: number, expectedHref: string) {
  const store = getStore()

  ensurePopStateListener()
  store.restoring = true
  store.pendingGuard = guard
  store.expectedRestoreHref = expectedHref
  store.restoreGeneration += 1
  clearRestoreTimer()
  const generation = store.restoreGeneration

  store.restoreTimer = setTimeout(() => {
    const latest = getStore()

    if (generation !== latest.restoreGeneration || !latest.restoring) return

    const missedHref = latest.expectedRestoreHref

    latest.restoring = false
    latest.pendingGuard = null
    latest.expectedRestoreHref = null
    latest.restoreTimer = null
    detachPopStateListener()

    // The back popstate was swallowed, and go() never restored the panel.
    // nuqs and Next still have the panel url until they see this popstate.
    if (missedHref && window.location.href !== missedHref) {
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
    }
  }, RESTORE_TIMEOUT_MS)

  window.setTimeout(() => {
    const latest = getStore()

    if (generation !== latest.restoreGeneration || !latest.restoring) return
    if (window.location.href === expectedHref) {
      finishRestore(guard)
      return
    }

    rememberPendingDestination(expectedHref)
    window.history.go(delta)

    if (window.location.href === expectedHref) finishRestore(guard)
  }, 0)
}

function onNavigate(event: Event) {
  if (readEventString(event, 'navigationType') !== 'traverse') return

  const userInitiated = Reflect.get(event, 'userInitiated')
  if (userInitiated !== true) return

  const destination = readDestination(event)
  if (destination.url && isPanelHistoryTraversalTo(destination.url)) return

  const hashOnly =
    destination.url !== null && isHashOnlyChange(window.location.href, destination.url)
  if (hashOnly) return

  const store = getStore()

  if (store.restoring) {
    store.restoring = false
    store.pendingGuard = null
    store.expectedRestoreHref = null
    store.restoreGeneration += 1
    clearRestoreTimer()
    detachPopStateListener()
  }

  const guard = [...store.guards].find((candidate) => candidate.shouldBlock())
  if (!guard) return

  const openIndex = readNavigation()?.currentEntry?.index
  const delta = traverseRestoreDelta(
    typeof openIndex === 'number' ? openIndex : null,
    destination.index
  )
  const expectedHref = window.location.href

  if (event.cancelable) {
    event.preventDefault()
    guard.onBlock()
    return
  }

  if (delta === null) return

  scheduleRestore(guard, delta, expectedHref)
}

function onNavigateSuccess() {
  if (getStore().routerEvents) return

  clearPendingDestination()
}

function onPopState(event: PopStateEvent) {
  const store = getStore()

  if (!store.restoring) return

  event.stopImmediatePropagation()

  if (window.location.href === store.expectedRestoreHref) finishRestore(store.pendingGuard)
}

/** Capture-phase popstate only while a canceled dirty back is being restored. */
function ensurePopStateListener() {
  const store = getStore()

  if (store.popStateListening || typeof window === 'undefined') return

  store.popStateListening = true
  window.addEventListener('popstate', onPopState, true)
}

function installListeners() {
  if (typeof window === 'undefined') return

  const store = getStore()
  const navigation = readNavigation()

  if (navigation && store.navigationTarget !== navigation) {
    navigation.addEventListener('navigate', onNavigate, true)
    navigation.addEventListener('navigatesuccess', onNavigateSuccess)
    navigation.addEventListener('currententrychange', onCurrentEntryChange)
    store.navigationTarget = navigation
  }

  store.listenersInstalled = true
}

/** Next clears the pending destination once the route change finishes. */
export function bindPanelTraversalRouter(events: RouterEvents) {
  const store = getStore()

  if (store.routerEvents !== events) {
    if (store.routerEvents) {
      store.routerEvents.off('routeChangeComplete', clearPendingDestination)
      store.routerEvents.off('routeChangeError', clearPendingDestination)
    }

    events.on('routeChangeComplete', clearPendingDestination)
    events.on('routeChangeError', clearPendingDestination)
    store.routerEvents = events
  }

  return () => {
    const current = getStore()

    if (current.routerEvents !== events) return

    events.off('routeChangeComplete', clearPendingDestination)
    events.off('routeChangeError', clearPendingDestination)
    current.routerEvents = null
  }
}

function isPromise(value: unknown): value is Promise<unknown> {
  return value instanceof Promise
}

function swallowAbortedNavigation(result: unknown) {
  if (typeof result !== 'object' || result === null) return
  ;(['committed', 'finished'] as const)
    .map((key) => Reflect.get(result, key))
    .filter(isPromise)
    .forEach((promise) => {
      promise.catch(clearPendingDestination)
    })
}

function traverseBy(delta: number) {
  installListeners()
  rememberPendingDestination(destinationHref(delta))

  const navigation = readNavigation()
  const back = navigation?.back

  if (delta === -1 && typeof back === 'function') {
    const result = back.call(navigation)
    swallowAbortedNavigation(result)
    return
  }

  if (delta === -1) {
    window.history.back()
    return
  }

  window.history.go(delta)
}

/** Call immediately before the open write that should push. */
export function armPanelPush(panelKey: string) {
  installListeners()
  const store = getStore()

  store.armedKeys.add(panelKey)
  clearArmTimer(panelKey)

  // nuqs flushes on a short timer. drop this key if its open never pushed.
  store.armTimers.set(
    panelKey,
    setTimeout(() => {
      const current = getStore()
      current.armedKeys.delete(panelKey)
      current.armTimers.delete(panelKey)
    }, ARM_TIMEOUT_MS)
  )
}

/** Replace a panel url and forget that key only. */
export function replacePanelUrl<T>(panelKey: string, replace: () => T) {
  installListeners()
  const store = getStore()

  store.owned.delete(panelKey)
  store.armedKeys.delete(panelKey)
  clearArmTimer(panelKey)
  return replace()
}

export function dismissPanelUrl(panelKey: string, replace: () => void) {
  installListeners()
  const store = getStore()
  const ownership = store.owned.get(panelKey) ?? null
  const navigation = readNavigation()
  const current = readCurrentLocation()
  const shouldGoBack = shouldGoBackOnDismiss({
    navigationAvailable: navigation !== null,
    ownership,
    currentEntryKey:
      typeof navigation?.currentEntry?.key === 'string' ? navigation.currentEntry.key : null,
    currentPathname: current.pathname,
    currentSearch: current.search,
    currentHash: current.hash,
    panelKey,
  })

  store.owned.delete(panelKey)
  store.armedKeys.delete(panelKey)
  clearArmTimer(panelKey)

  if (!shouldGoBack) {
    replace()
    return
  }

  const entryKey = ownership?.entryKey ?? null
  const alreadyLeavingThisEntry = entryKey !== null && store.pendingBackEntryKey === entryKey
  if (alreadyLeavingThisEntry) return

  store.pendingBackEntryKey = entryKey
  queueMicrotask(() => {
    const latest = getStore()
    if (latest.pendingBackEntryKey === entryKey) latest.pendingBackEntryKey = null
  })
  traverseBy(-1)
}

export function registerPanelBackGuard(guard: PanelGuard) {
  installListeners()
  getStore().guards.add(guard)

  return () => {
    getStore().guards.delete(guard)
  }
}

/** Test-only. Production never needs to drop ownership by hand. */
export function resetPanelHistoryForTests() {
  const store = getStore()

  store.owned.clear()
  store.armedKeys.clear()
  store.pendingBackEntryKey = null
  store.pendingDestinationHref = null
  store.restoring = false
  store.pendingGuard = null
  store.expectedRestoreHref = null
  store.restoreGeneration += 1
  store.guards.clear()
  clearPendingTimer()
  clearRestoreTimer()
  clearArmTimers()
  detachPopStateListener()
}
