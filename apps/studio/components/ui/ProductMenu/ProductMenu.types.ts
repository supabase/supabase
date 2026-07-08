import { ReactNode } from 'react'

import type { ShortcutId } from '@/state/shortcuts/registry'

export interface ProductMenuGroup {
  title?: string
  /** Set to "main" if page is on a '/' route */
  key?: string | 'main'
  isPreview?: boolean
  name?: string
  items: ProductMenuGroupItem[]
  link?: string
  /** Optional node rendered after the group's items (e.g. a footer note) */
  footer?: ReactNode
}

export interface ProductMenuGroupItem {
  name: string
  key: string
  url: string
  items?: any[]
  icon?: ReactNode
  rightIcon?: ReactNode
  isExternal?: boolean
  disabled?: boolean
  label?: string
  hasChild?: boolean
  childId?: string
  childIcon?: ReactNode
  childItems?: ProductMenuGroupItem[]
  pages?: string[]
  shortcutId?: ShortcutId
  isLoading?: boolean
}

/**
 * Generic section format for SubMenu. Compatible with SidebarSection from AccountLayout.
 */
export interface SubMenuSection {
  key: string
  heading?: string
  links: Array<{ key: string; label: string; href?: string; shortcutId?: ShortcutId }>
}

export interface SubMenuProps {
  sections: SubMenuSection[]
  page?: string
  onItemClick?: () => void
}
