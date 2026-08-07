/**
 * PROTOTYPE — provider so the product menu (sidebar) and the page content share
 * one state instance.
 *
 * This mirrors how the real thing is wired: the Explorer tab store and notebook
 * save coordinator are mounted at the layout level (like
 * `SqlEditorSaveCoordinatorProvider` in `ProjectContext`), not inside the page,
 * because the sidebar lives in `ProjectLayout`'s `productMenu` slot and the
 * views live in `children`.
 */

import { createContext, useContext, type PropsWithChildren } from 'react'

import { useExplorerPrototypeState, type ExplorerPrototypeState } from './useExplorerPrototypeState'

const ExplorerPrototypeContext = createContext<ExplorerPrototypeState | undefined>(undefined)

export const ExplorerPrototypeProvider = ({ children }: PropsWithChildren) => {
  const state = useExplorerPrototypeState()

  return (
    <ExplorerPrototypeContext.Provider value={state}>{children}</ExplorerPrototypeContext.Provider>
  )
}

export const useExplorerPrototype = () => {
  const context = useContext(ExplorerPrototypeContext)
  if (context === undefined) {
    throw new Error('useExplorerPrototype must be used within an ExplorerPrototypeProvider')
  }
  return context
}
