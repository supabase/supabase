import type { NavMenuSection, NavMenuGroup } from '../Navigation.types'

export function transformNavMenuToNavSections(navGroups: NavMenuGroup[]): NavMenuSection[] {
  return navGroups.flatMap((group) => group.items.filter((item) => item.enabled !== false))
}
