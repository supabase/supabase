type supportedFrameworks = 'nextjs' | 'react-router' | 'tanstack' | 'react' | 'vue' | 'nuxtjs'
export interface NavItem {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
  new?: boolean
  icon?: any // to do: clean up later | keyof typeof Icons
  label?: string
  supportedFrameworks?: supportedFrameworks[]
  requiresAuth?: boolean
}

export interface NavItemWithChildren extends NavItem {
  items?: NavItemWithChildren[]
}

export interface MainNavItem extends NavItem {}

export interface SidebarNavItem extends NavItemWithChildren {}

export interface SidebarNavGroup extends NavItem {
  items: (SidebarNavItem & { commandItemLabel: string })[]
}
