import { ReactNode } from 'react'

export interface ProductMenuGroup {
  title?: string
  /** Set to "main" if page is on a '/' route */
  key?: string | 'main'
  isPreview?: boolean
  name?: string
  items: ProductMenuGroupItem[]
  link?: string
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
}

/**
 * Generic section format for SubMenu. Compatible with SidebarSection from AccountLayout.
 */
export interface SubMenuSection {
  key: string
  heading?: string
  links: Array<{ key: string; label: string; href?: string }>
}

export interface SubMenuProps {
  sections: SubMenuSection[]
  page?: string
  onItemClick?: () => void
}
