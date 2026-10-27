type HistoryEntry = {
  key: string
  index: number
  url: string
  state: unknown
}

type NavigateExtras = {
  navigationType: 'push' | 'replace' | 'traverse'
  userInitiated?: boolean
  destinationIndex?: number | null
  destinationUrl?: string | null
  cancelable?: boolean
}

let installed = false
let stack: HistoryEntry[] = []
let index = 0
let sequence = 0
let activationConsumed = false
let originalPushState: History['pushState'] | null = null
let originalReplaceState: History['replaceState'] | null = null
let originalBack: History['back'] | null = null
let originalForward: History['forward'] | null = null
let originalGo: History['go'] | null = null
let navigationTarget: EventTarget | null = null

function currentEntry() {
  return stack[index]
}

function emit(type: string, extras: NavigateExtras) {
  if (!navigationTarget) return false

  const cancelable = activationConsumed ? false : (extras.cancelable ?? false)
  if (activationConsumed) activationConsumed = false

  const event = new Event(type, { cancelable })
  Object.defineProperty(event, 'navigationType', { value: extras.navigationType })

  if (extras.userInitiated !== undefined) {
    Object.defineProperty(event, 'userInitiated', { value: extras.userInitiated })
  }

  if (extras.destinationUrl !== undefined || extras.destinationIndex !== undefined) {
    Object.defineProperty(event, 'destination', {
      value: { index: extras.destinationIndex ?? null, url: extras.destinationUrl ?? null },
    })
  }

  // jsdom's dispatchEvent can ignore a replaced preventDefault, so track it ourselves.
  let prevented = false
  const preventDefault = event.preventDefault.bind(event)
  event.preventDefault = () => {
    prevented = true
    preventDefault()
  }

  navigationTarget.dispatchEvent(event)
  return !prevented
}

function showEntry(entry: HistoryEntry) {
  index = entry.index
  if (navigationTarget) {
    Object.defineProperty(navigationTarget, 'currentEntry', {
      configurable: true,
      value: entry,
    })
  }

  // the url moves before this call returns. popstate is a later task, like a browser.
  originalReplaceState?.call(window.history, entry.state, '', entry.url)
  const state = entry.state
  window.setTimeout(() => {
    if (!installed) return
    window.dispatchEvent(new PopStateEvent('popstate', { state }))
    emit('navigatesuccess', { navigationType: 'traverse' })
  }, 0)
  emit('currententrychange', { navigationType: 'traverse' })
}

function reindex() {
  stack.forEach((entry, entryIndex) => {
    entry.index = entryIndex
  })
}

function commitTraverse(delta: number, userInitiated: boolean) {
  const nextIndex = index + delta
  if (nextIndex < 0 || nextIndex >= stack.length) return

  const destination = stack[nextIndex]
  let prevented = false

  const continued = emit('navigate', {
    navigationType: 'traverse',
    userInitiated,
    destinationIndex: destination.index,
    destinationUrl: destination.url,
    cancelable: true,
  })
  prevented = continued === false

  if (prevented) return

  const entry = stack[nextIndex]
  if (!entry) return

  showEntry(entry)
}

export function installNavigationDouble() {
  if (installed) uninstallNavigationDouble()

  stack = [{ key: 'entry-0', index: 0, url: window.location.href, state: window.history.state }]
  index = 0
  sequence = 0
  activationConsumed = false
  navigationTarget = new EventTarget()
  Object.defineProperty(navigationTarget, 'currentEntry', {
    configurable: true,
    writable: true,
    value: stack[0],
  })
  Object.defineProperty(navigationTarget, 'entries', {
    configurable: true,
    value: () => stack,
  })
  Object.defineProperty(navigationTarget, 'back', {
    configurable: true,
    writable: true,
    value: () => {
      // Scripted navigation.back() is not user initiated. committed and finished
      // both reject with AbortError when a later navigation interrupts them.
      const settled = Promise.resolve()
      commitTraverse(-1, false)
      return { finished: settled, committed: settled }
    },
  })

  originalPushState = window.history.pushState.bind(window.history)
  originalReplaceState = window.history.replaceState.bind(window.history)
  originalBack = window.history.back.bind(window.history)
  originalForward = window.history.forward.bind(window.history)
  originalGo = window.history.go.bind(window.history)

  window.history.pushState = (state, title, url) => {
    originalPushState?.call(window.history, state, title, url)
    stack.splice(index + 1)
    index += 1
    sequence += 1
    stack.push({
      key: `entry-${sequence}`,
      index,
      url: window.location.href,
      state: window.history.state,
    })
    reindex()
    Object.defineProperty(navigationTarget, 'currentEntry', {
      configurable: true,
      value: currentEntry(),
    })
    emit('currententrychange', { navigationType: 'push' })
  }

  window.history.replaceState = (state, title, url) => {
    originalReplaceState?.call(window.history, state, title, url)
    const entry = currentEntry()
    if (entry) {
      entry.url = window.location.href
      entry.state = window.history.state
    }
    Object.defineProperty(navigationTarget, 'currentEntry', {
      configurable: true,
      value: currentEntry(),
    })
    emit('currententrychange', { navigationType: 'replace' })
  }

  window.history.back = () => {
    commitTraverse(-1, false)
  }
  window.history.forward = () => {
    commitTraverse(1, false)
  }
  window.history.go = (delta) => {
    if (typeof delta !== 'number' || delta === 0) return
    commitTraverse(delta, false)
  }

  Object.defineProperty(window, 'navigation', {
    configurable: true,
    value: navigationTarget,
  })
  installed = true
}

export function uninstallNavigationDouble() {
  if (!installed) return

  if (originalPushState) window.history.pushState = originalPushState
  if (originalReplaceState) window.history.replaceState = originalReplaceState
  if (originalBack) window.history.back = originalBack
  if (originalForward) window.history.forward = originalForward
  if (originalGo) window.history.go = originalGo

  originalPushState = null
  originalReplaceState = null
  originalBack = null
  originalForward = null
  originalGo = null
  navigationTarget = null
  Reflect.deleteProperty(window, 'navigation')
  installed = false
}

export function userTraverse(delta: number) {
  commitTraverse(delta, true)
}

export function emitUserNavigate(destinationUrl: string) {
  emit('navigate', {
    navigationType: 'traverse',
    userInitiated: true,
    destinationIndex: index,
    destinationUrl,
    cancelable: true,
  })
}

export function consumeUserActivation() {
  activationConsumed = true
}
