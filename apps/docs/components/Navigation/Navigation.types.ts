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

export interface References {
  [key: string]: {
    name: string
    library?: string
    versions: string[]
    icon: string
    currentVersion?: string
  }
}

type MenuItem = {
  label: string
  icon?: string
  href?: `/${string}` | `https://${string}`
  level?: string
  hasLightIcon?: boolean
  community?: boolean
}

export type HomepageMenuItems = MenuItem[][]

export type NavMenuConstant = Readonly<{
  title: string
  icon: string
  url?: `/${string}`
  items: ReadonlyArray<Partial<NavMenuSection>>
}>
