export const resetHistoryTraverseState = () => {
  const state = window.__studioHistoryTraverseState
  if (!state) return

  state.isTraverseNavigation = false
  state.isShellReady = false
  state.documentConsumed = false
}
