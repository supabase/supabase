const POSITION = '__studioHistoryPosition'

export const getHistoryPosition = (state: unknown): number | undefined => {
  if (typeof state !== 'object' || state === null || !(POSITION in state)) return
  return typeof state[POSITION] === 'number' ? state[POSITION] : undefined
}

// Next's history keys are random. Track positions from app startup so a blocked
// traversal can be reversed without replacing entries or losing Forward history.
export const trackHistoryPositions = () => {
  const { pushState, replaceState } = window.history
  let position = getHistoryPosition(window.history.state) ?? 0
  replaceState.call(window.history, { ...window.history.state, [POSITION]: position }, '')
  window.history.pushState = function (state, title, url) {
    position = (getHistoryPosition(window.history.state) ?? position) + 1
    pushState.call(this, { ...state, [POSITION]: position }, title, url)
  }
  window.history.replaceState = function (state, title, url) {
    position = getHistoryPosition(window.history.state) ?? position
    replaceState.call(this, { ...state, [POSITION]: position }, title, url)
  }
  return () => {
    window.history.pushState = pushState
    window.history.replaceState = replaceState
  }
}
