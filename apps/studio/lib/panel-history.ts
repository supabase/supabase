/**
 * Each open push records `navigation.currentEntry.key` for that panel param.
 * Close goes back only when that key is still current and the rest of the url
 * is unchanged. Otherwise close replaces. Without the Navigation API, close
 * always replaces.
 *
 * The store lives on `globalThis` so every copy of this module shares it.
 */

import {
  isHashOnlyChange,
  searchWithoutPanelParam,
  shouldGoBackOnDismiss,
  traverseRestoreDelta,
  type PanelEntryOwnership,
} from './panel-history.utils'

type PanelGuard = {
  shouldBlock: () => boolean
  onBlock: () => void
}

type PanelHistoryStore = {
  owned: Map<string, PanelEntryOwnership>
  armedKeys: Set<string>
  armTimer: ReturnType<typeof setTimeout> | null
  pendingBackEntryKey: string | null
  panelTraversal: boolean
  traversalGeneration: number
  traversalSettled: number
  restoring: boolean
  pendingGuard: PanelGuard | null
  expectedRestoreHref: string | null
  restoreGeneration: number
  listenersInstalled: boolean
  navigationTarget: EventTarget | null
  guards: Set<PanelGuard>
}

type NavigationHistoryEntryLike = {
  key?: string
  index?: number
  url?: string | null
}

type NavigationLike = EventTarget & {
  currentEntry?: NavigationHistoryEntryLike | null
  back?: () => Promise<unknown>
}

const STORE_KEY = '__supabasePanelHistory'
const ARM_TIMEOUT_MS = 500

type PanelHistoryGlobal = typeof globalThis & {
  [STORE_KEY]?: PanelHistoryStore
}

function createStore(): PanelHistoryStore {
  return {
    owned: new Map(),
    armedKeys: new Set(),
    armTimer: null,
    pendingBackEntryKey: null,
    panelTraversal: false,
    traversalGeneration: 0,
    traversalSettled: 0,
    restoring: false,
    pendingGuard: null,
    expectedRestoreHref: null,
    restoreGeneration: 0,
    listenersInstalled: false,
    navigationTarget: null,
    guards: new Set(),
  }
}

function getStore() {
  const scope = globalThis as PanelHistoryGlobal
  const existing = scope[STORE_KEY]

  if (existing && existing.owned instanceof Map && existing.guards instanceof Set) return existing

  const created = createStore()
  scope[STORE_KEY] = created
  return created
}

function readNavigation(): NavigationLike | null {
  if (typeof window === 'undefined') return null

  const candidate = Reflect.get(window, 'navigation')
  if (typeof candidate !== 'object' || candidate === null) return null
  if (typeof Reflect.get(candidate, 'addEventListener') !== 'function') return null

  return candidate as NavigationLike
}

function clearArmTimer() {
  const store = getStore()

  if (store.armTimer === null) return

  clearTimeout(store.armTimer)
  store.armTimer = null
}

function captureOwnership(panelKey: string): PanelEntryOwnership | null {
  const entry = readNavigation()?.currentEntry
  const entryKey = typeof entry?.key === 'string' ? entry.key : null

  if (entryKey === null) return null

  const href = window.location.href
  const url = new URL(href)

  return {
    entryKey,
    index: typeof entry?.index === 'number' ? entry.index : null,
    pathname: url.pathname,
    searchWithoutPanel: searchWithoutPanelParam(url.search, panelKey),
    hash: url.hash,
    href,
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

  for (const panelKey of store.armedKeys) {
    const owned = captureOwnership(panelKey)
    if (owned) store.owned.set(panelKey, owned)
  }

  store.armedKeys.clear()
  clearArmTimer()
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

function finishRestore(blocked: PanelGuard | null) {
  const store = getStore()

  if (store.restoring === false) return

  store.restoring = false
  store.pendingGuard = null
  store.expectedRestoreHref = null
  store.restoreGeneration += 1
  store.panelTraversal = false

  if (blocked) blocked.onBlock()
}

function scheduleRestore(guard: PanelGuard, delta: number, expectedHref: string) {
  const store = getStore()

  store.restoring = true
  store.pendingGuard = guard
  store.expectedRestoreHref = expectedHref
  store.restoreGeneration += 1
  const generation = store.restoreGeneration

  window.setTimeout(() => {
    const latest = getStore()

    if (generation !== latest.restoreGeneration || latest.restoring === false) return
    if (window.location.href === expectedHref) {
      finishRestore(guard)
      return
    }

    withPanelHistoryTraversal(() => {
      window.history.go(delta)
    })

    if (window.location.href === expectedHref) finishRestore(guard)
  }, 0)
}

function onNavigate(event: Event) {
  if (readEventString(event, 'navigationType') !== 'traverse') return

  const userInitiated = Reflect.get(event, 'userInitiated')
  if (userInitiated !== true) return

  const store = getStore()
  if (store.panelTraversal) return

  const destination = readDestination(event)
  const hashOnly =
    destination.url !== null && isHashOnlyChange(window.location.href, destination.url)
  if (hashOnly) return

  if (store.restoring) {
    store.restoring = false
    store.pendingGuard = null
    store.expectedRestoreHref = null
    store.restoreGeneration += 1
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
    try {
      event.preventDefault()
      guard.onBlock()
      return
    } catch {
      // the user activation was already used, so the traverse will commit
    }
  }

  if (delta === null) return

  scheduleRestore(guard, delta, expectedHref)
}

function settlePanelTraversal() {
  const store = getStore()

  if (store.panelTraversal === false) return

  const generation = store.traversalGeneration
  store.traversalSettled = generation

  // after this event, so a page blocker on the same pop still sees the flag
  queueMicrotask(() => {
    const current = getStore()

    if (current.traversalGeneration !== generation) return

    current.panelTraversal = false
  })
}

function onPopState(event: PopStateEvent) {
  const store = getStore()

  // clear after this event so a page blocker running on the same pop still sees it
  if (store.panelTraversal) settlePanelTraversal()

  if (store.restoring === false) return

  event.stopImmediatePropagation()

  if (window.location.href === store.expectedRestoreHref) finishRestore(store.pendingGuard)
}

function installListeners() {
  if (typeof window === 'undefined') return

  const store = getStore()
  const navigation = readNavigation()

  if (navigation && store.navigationTarget !== navigation) {
    navigation.addEventListener('navigate', onNavigate, true)
    navigation.addEventListener('currententrychange', onCurrentEntryChange)
    store.navigationTarget = navigation
  }

  if (store.listenersInstalled) return

  store.listenersInstalled = true
  window.addEventListener('popstate', onPopState, true)
}

/** True while this module is moving history for a panel close or restore. */
export function isPanelHistoryTraversal() {
  return getStore().panelTraversal
}

function beginPanelTraversal() {
  const store = getStore()

  store.traversalGeneration += 1
  store.panelTraversal = true
  return store.traversalGeneration
}

function clearPanelTraversalIfUnsettled(generation: number) {
  // jsdom fires popstate two timers after back(). one timer clears the flag first.
  window.setTimeout(() => {
    window.setTimeout(() => {
      const current = getStore()

      if (current.traversalGeneration !== generation) return
      if (current.traversalSettled === generation) return

      current.panelTraversal = false
    }, 0)
  }, 0)
}

/** Keep page-level unsaved-changes guards from trapping a panel's own back. */
export function withPanelHistoryTraversal(run: () => void) {
  const generation = beginPanelTraversal()

  try {
    run()
  } finally {
    clearPanelTraversalIfUnsettled(generation)
  }
}

function traverseBack() {
  installListeners()
  const generation = beginPanelTraversal()
  const navigation = readNavigation()
  const back = navigation?.back

  if (typeof back === 'function') {
    try {
      back.call(navigation)
      clearPanelTraversalIfUnsettled(generation)
      return
    } catch {
      getStore().panelTraversal = false
    }
  }

  window.history.back()
  clearPanelTraversalIfUnsettled(generation)
}

/** Call immediately before the open write that should push. */
export function armPanelPush(panelKey: string) {
  installListeners()
  const store = getStore()

  store.armedKeys.add(panelKey)
  clearArmTimer()

  // nuqs flushes on a short timer. drop the arm if this open never pushed.
  store.armTimer = setTimeout(() => {
    const current = getStore()
    current.armedKeys.clear()
    current.armTimer = null
  }, ARM_TIMEOUT_MS)
}

/** Replace a panel url and forget that key only. */
export function replacePanelUrl<T>(panelKey: string, replace: () => T) {
  installListeners()
  const store = getStore()

  store.owned.delete(panelKey)
  store.armedKeys.delete(panelKey)
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

  if (shouldGoBack === false) {
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
  traverseBack()
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
  store.panelTraversal = false
  store.traversalGeneration += 1
  store.traversalSettled = 0
  store.restoring = false
  store.pendingGuard = null
  store.expectedRestoreHref = null
  store.restoreGeneration += 1
  store.guards.clear()
  clearArmTimer()
}
