export type SidebarLink = {
  label: string
  href?: string
  key: string
  icon?: string
  isExternal?: boolean
  isActive?: boolean
  subitemsKey?: string // I dont think this is being used at all
  onClick?: () => Promise<void>
}

export type SidebarSection = {
  key: string
  heading?: string
  versionLabel?: string
  links: SidebarLink[]
}
