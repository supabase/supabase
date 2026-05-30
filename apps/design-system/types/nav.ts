// import { Icons } from '@/components/icons'

export interface NavItem {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
  icon?: any // to do: clean up later | keyof typeof Icons
  label?: string
  priority?: boolean // If true, item appears first even when section is sorted alphabetically
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[]
  sortOrder?: 'manual' | 'alphabetical' // Sidebar navigation sort order for top-level sections
}

export interface MainNavItem extends NavItem {}

export interface SidebarNavItem extends NavItemWithChildren {}
