'use client'

import { proxy, useSnapshot } from 'valtio'

interface CommandMenuFilterBarState {
  // Matches ICommandSection['id']. null = "All" (no section filter applied).
  activeSectionId: string | null
}

// POC: shared state so the filter chip bar (reading all registered sections)
// and the list renderer (which section(s) to actually show) agree on the
// current selection without prop-drilling through the generic CommandMenu
// tree.
export const commandMenuFilterBarState = proxy<CommandMenuFilterBarState>({
  activeSectionId: null,
})

export function useActiveSectionId() {
  return useSnapshot(commandMenuFilterBarState).activeSectionId
}

export function setActiveSectionId(sectionId: string | null) {
  commandMenuFilterBarState.activeSectionId = sectionId
}
