import { createContext, use, type RefCallback } from 'react'

import type { DropdownMenuItem, NavMenuSection } from '../Navigation.types'

export type SidebarLevel =
  | { kind: 'sections' }
  | { kind: 'section'; section: DropdownMenuItem }
  | { kind: 'product'; item: DropdownMenuItem }

export interface DocsSidebarNavState {
  pathname: string
  stack: SidebarLevel[]
  level: SidebarLevel
  activeItem: DropdownMenuItem | undefined
  additionalNavItems: Record<string, Partial<NavMenuSection>[]> | undefined
  onLevelOpen: (level: SidebarLevel) => void
  onLevelJump: (index: number) => void
  onSectionSelect: (href: string) => void
  levelChangeRef: RefCallback<HTMLElement>
}

export const DocsSidebarNavContext = createContext<DocsSidebarNavState | null>(null)

export const useDocsSidebarNav = (): DocsSidebarNavState => {
  const state = use(DocsSidebarNavContext)
  if (!state) throw new Error('useDocsSidebarNav must be used within DocsSidebarNavProvider')
  return state
}
