import { createContext, use } from 'react'

import type { DropdownMenuItem } from '../Navigation.types'

export type SidebarLevel =
  | { kind: 'sections' }
  | { kind: 'section'; section: DropdownMenuItem }
  | { kind: 'product'; item: DropdownMenuItem }

export interface DocsSidebarNavState {
  pathname: string
  stack: SidebarLevel[]
  level: SidebarLevel
  activeItem: DropdownMenuItem | undefined
  hasSectionHeader: boolean
  isSectionHome: boolean
  onLevelOpen: (level: SidebarLevel) => void
  onLevelJump: (index: number) => void
  onSectionSelect: (href: string) => void
}

export const DocsSidebarNavContext = createContext<DocsSidebarNavState | null>(null)

export const useDocsSidebarNav = (): DocsSidebarNavState => {
  const state = use(DocsSidebarNavContext)
  if (!state) throw new Error('useDocsSidebarNav must be used within DocsSidebarNavProvider')
  return state
}

// the section tree also renders outside the docs sidebar, where no header row exists
export const useHasSectionHeader = (): boolean =>
  use(DocsSidebarNavContext)?.hasSectionHeader ?? false
