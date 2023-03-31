export interface NavMenu {
  [key: string]: NavMenuGroup[]
}

export interface NavMenuGroup {
  label: string
  items: NavMenuSection[]
}

export interface NavMenuSection {
  name: string
  url?: string
  items: NavMenuSection[]
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
