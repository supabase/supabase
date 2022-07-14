export interface SidebarLinkGroup {
  heading: string
  links: SidebarLink[]
}

export interface SidebarLink {
  key: string
  label: string
  icon?: string
  href?: string
  subitemsKey?: string // I dont think this is being used at all
  isActive?: boolean
  isExternal?: boolean
  onClick?: () => void
}
