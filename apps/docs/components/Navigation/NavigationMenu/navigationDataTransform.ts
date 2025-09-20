import type { NavMenuSection, NavMenuGroup } from '../Navigation.types'
import type { MenuItem } from './RecursiveNavigation'

export function transformNavMenuToMenuItems(navGroups: NavMenuGroup[]): MenuItem[] {
  return navGroups.map(transformNavGroup)
}

function transformNavGroup(group: NavMenuGroup): MenuItem {
  return {
    title: group.label,
    type: 'category',
    children: group.items.filter((item) => item.enabled !== false).map(transformNavSection),
  }
}

function transformNavSection(section: NavMenuSection): MenuItem {
  const hasChildren = section.items && section.items.length > 0

  const menuItem: MenuItem = {
    title: section.name,
    url: section.url,
    icon: section.icon,
    enabled: section.enabled,
    type: hasChildren ? 'category' : 'link',
  }

  if (hasChildren) {
    menuItem.children = section.items
      .filter((item) => item.enabled !== false)
      .map((item) => transformNavSection(item as NavMenuSection))
  }

  return menuItem
}
