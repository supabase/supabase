export interface NavMenu {
  [key: string]: NavMenuGroup[]
}

export interface NavMenuGroup {
  label: string
  items: NavMenuSection[]
}

export interface NavMenuSection {
  name: string
  url?: `/${string}`
  items: Partial<NavMenuSection>[]
}

type MenuItem = {
  label: string
  icon?: string
  href?: `/${string}` | `https://${string}`
  level?: string
  hasLightIcon?: boolean
  community?: boolean
}

export type DropdownMenuItem = MenuItem & {
  menuItems?: MenuItem[][]
}

export type GlobalMenuItems = DropdownMenuItem[][]

export type NavMenuConstant = Readonly<{
  title: string
  icon: string
  url?: `/${string}`
  items: ReadonlyArray<Partial<NavMenuSection>>
}>
