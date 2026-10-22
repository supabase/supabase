/**
 * Close behavior for URL-driven panels.
 *
 * Ownership is `history.length` after the open `pushState`, cleared on popstate
 * and on refresh. That is more reliable here than a `history.state` marker:
 * both the Next pages adapter and the TanStack adapter write a fresh history
 * state on later `replace` updates (search, row switch, connect hydration),
 * which would strip a marker from an entry we still own. `history.length` stays
 * put across those replaces. A ref inside one hook is not enough either —
 * several components share a key, and the one that closes is often not the one
 * that opened.
 *
 * The store lives on `globalThis` so every copy of this module (the dev server
 * evaluates it more than once) shares one listener and one guard set.
 *
 * Chrome applies Back before `popstate`, and React renders the panel closed
 * before that listener can see `active`. Where `window.navigation` exists,
 * cancel the traverse on `navigate` while the guard is still dirty. `popstate`
 * remains for jsdom and browsers without the Navigation API.
 *
 * Refresh creates a new document, so the store is empty and close replaces.
 * Back/Forward fires popstate and clears ownership, so a restored panel replaces.
 * A deep link never armed a push, so close replaces.
 * Save and delete always replace, even when we own the entry.
 */

type PanelGuard = {
  shouldBlock: () => boolean
  onBlock: () => void
}

type PanelHistoryStore = {
  ownedLength: number | null
  armed: boolean
  armTimer: ReturnType<typeof setTimeout> | null
  bypassNextPop: boolean
  dismissLocked: boolean
  inCommit: boolean
  restoring: boolean
  pendingGuard: PanelGuard | null
  restoreGeneration: number
  traverseBlocked: boolean
  navigateInstalled: boolean
  navigationTarget: EventTarget | null
  installed: boolean
  originalPushState: History['pushState'] | null
  originalReplaceState: History['replaceState'] | null
  guards: Set<PanelGuard>
}

const STORE_KEY = '__supabasePanelHistory'

function createStore(): PanelHistoryStore {
  return {
    ownedLength: null,
    armed: false,
    armTimer: null,
    bypassNextPop: false,
    dismissLocked: false,
    inCommit: false,
    restoring: false,
    pendingGuard: null,
    restoreGeneration: 0,
    traverseBlocked: false,
    navigateInstalled: false,
    navigationTarget: null,
    installed: false,
    originalPushState: null,
    originalReplaceState: null,
    guards: new Set(),
  }
}

function getStore() {
  const scope = globalThis as typeof globalThis & { [STORE_KEY]?: PanelHistoryStore }

  if (!scope[STORE_KEY]) scope[STORE_KEY] = createStore()

  return scope[STORE_KEY]
}

function finishRestore(blocked: PanelGuard | null) {
  const store = getStore()

  store.restoring = false
  store.pendingGuard = null
  store.restoreGeneration += 1
  blocked?.onBlock()
}

function rememberOwnedLength() {
  getStore().ownedLength = window.history.length
}

type PanelNavigateEvent = Event & { navigationType?: string }

function installNavigateListener() {
  const store = getStore()

  const navigation = (window as Window & { navigation?: EventTarget }).navigation

  if (!navigation || typeof navigation.addEventListener !== 'function') return

  if (store.navigateInstalled && store.navigationTarget === navigation) return

  store.navigateInstalled = true
  store.navigationTarget = navigation

  navigation.addEventListener(
    'navigate',
    (event) => {
      const navigateEvent = event as PanelNavigateEvent

      if (navigateEvent.navigationType !== 'traverse' || !navigateEvent.cancelable) return

      const current = getStore()

      // Closing an owned panel calls history.back() itself. Let that through.
      if (current.bypassNextPop || current.restoring) return

      const guard = [...current.guards].find((candidate) => candidate.shouldBlock())

      if (!guard) return

      navigateEvent.preventDefault()
      current.traverseBlocked = true
      guard.onBlock()
      window.setTimeout(() => {
        getStore().traverseBlocked = false
      }, 0)
    },
    true
  )
}

function installHistoryHooks() {
  if (typeof window === 'undefined') return

  installNavigateListener()

  const store = getStore()

  if (store.installed) return

  store.installed = true
  store.originalPushState = window.history.pushState.bind(window.history)
  store.originalReplaceState = window.history.replaceState.bind(window.history)

  window.history.pushState = function panelPushState(state, title, url) {
    const current = getStore()
    const result = current.originalPushState!.call(window.history, state, title, url)

    if (current.armed) {
      current.armed = false

      if (current.armTimer !== null) {
        clearTimeout(current.armTimer)
        current.armTimer = null
      }

      rememberOwnedLength()
    }

    return result
  }

  window.history.replaceState = function panelReplaceState(state, title, url) {
    return getStore().originalReplaceState!.call(window.history, state, title, url)
  }

  window.addEventListener(
    'popstate',
    (event) => {
      const current = getStore()

      if (current.bypassNextPop) {
        current.bypassNextPop = false
        return
      }

      if (current.traverseBlocked) {
        current.traverseBlocked = false
        event.stopImmediatePropagation()
        return
      }

      if (current.restoring) {
        // This pop is the go(1) that put the panel entry back. Ask only now,
        // so a confirm cannot dismiss before that entry is current again.
        const blocked = current.pendingGuard
        event.stopImmediatePropagation()
        finishRestore(blocked)
        return
      }

      const guard = [...current.guards].find((candidate) => candidate.shouldBlock())

      if (guard) {
        // Back already left the panel entry on the forward stack. Put that
        // entry back before nuqs or the router apply the popped URL, then ask.
        // go() during popstate is ignored, so restore on the next turn.
        event.stopImmediatePropagation()
        current.restoring = true
        current.pendingGuard = guard
        const generation = current.restoreGeneration

        window.setTimeout(() => {
          const latest = getStore()

          if (generation !== latest.restoreGeneration || !latest.restoring) return

          window.history.go(1)

          // jsdom and the browser both fire the restore popstate. If a go is
          // a no-op, still ask rather than leaving the panel stuck open.
          window.setTimeout(() => {
            const afterGo = getStore()

            if (generation !== afterGo.restoreGeneration || !afterGo.restoring) return

            finishRestore(afterGo.pendingGuard)
          }, 50)
        }, 0)
        return
      }

      current.ownedLength = null
    },
    true
  )
}

function ownsCurrentPanelEntry() {
  const { ownedLength } = getStore()

  return ownedLength !== null && ownedLength === window.history.length
}

/** Call immediately before the open `setQueryState` that should push. */
export function armPanelPush() {
  installHistoryHooks()
  const store = getStore()

  store.armed = true

  if (store.armTimer !== null) clearTimeout(store.armTimer)

  // nuqs flushes on a short timer. If this open did not push, drop the arm
  // so a later unrelated push is not treated as the panel entry.
  store.armTimer = setTimeout(() => {
    const current = getStore()

    current.armed = false
    current.armTimer = null
  }, 500)
}

export function commitPanelUrl(replace: () => void) {
  installHistoryHooks()
  const store = getStore()

  store.armed = false
  store.ownedLength = null

  if (store.inCommit) {
    replace()
    return
  }

  store.inCommit = true

  try {
    replace()
  } finally {
    getStore().inCommit = false
  }
}

/** Drop a panel id the page cannot show, without pushing another entry. */
export function replaceMissingPanelId(replace: () => void) {
  commitPanelUrl(replace)
}

export function dismissPanelUrl(replace: () => void) {
  installHistoryHooks()
  const store = getStore()

  if (store.dismissLocked) return

  if (ownsCurrentPanelEntry()) {
    store.dismissLocked = true
    queueMicrotask(() => {
      getStore().dismissLocked = false
    })
    store.ownedLength = null
    store.bypassNextPop = true
    window.history.back()
    return
  }

  commitPanelUrl(replace)
}

type PanelHistoryScope = typeof globalThis & {
  __registerSupabasePanelBackGuard?: (guard: PanelGuard) => () => void
}

function registerOnSharedStore(guard: PanelGuard) {
  installHistoryHooks()
  getStore().guards.add(guard)

  return () => {
    getStore().guards.delete(guard)
  }
}

export function registerPanelBackGuard(guard: PanelGuard) {
  const register =
    (globalThis as PanelHistoryScope).__registerSupabasePanelBackGuard ?? registerOnSharedStore

  return register(guard)
}

;(globalThis as PanelHistoryScope).__registerSupabasePanelBackGuard = registerOnSharedStore

export function isCommittingPanelUrl() {
  return getStore().inCommit
}

/** Test-only. Production never needs to drop ownership by hand. */
export function resetPanelHistoryForTests() {
  const store = getStore()

  store.ownedLength = null
  store.armed = false
  store.bypassNextPop = false
  store.dismissLocked = false
  store.inCommit = false
  store.restoring = false
  store.pendingGuard = null
  store.restoreGeneration += 1
  store.traverseBlocked = false
  store.guards.clear()

  if (store.armTimer !== null) {
    clearTimeout(store.armTimer)
    store.armTimer = null
  }
}
