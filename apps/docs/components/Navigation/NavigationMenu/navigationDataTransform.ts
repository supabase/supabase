import type { NavMenuSection, NavMenuGroup } from '../Navigation.types'
import type { MenuItem } from './RecursiveNavigation'


export function transformNavMenuToMenuItems(navGroups: NavMenuGroup[]): MenuItem[] {
  return navGroups.map(transformNavGroup)
}

function transformNavGroup(group: NavMenuGroup): MenuItem {
  return {
    title: group.label,
    type: 'category',
    children: group.items
      .filter(item => item.enabled !== false)
      .map(transformNavSection)
  }
}

function transformNavSection(section: NavMenuSection): MenuItem {
  const hasChildren = section.items && section.items.length > 0
  
  const menuItem: MenuItem = {
    title: section.name,
    url: section.url,
    icon: section.icon,
    enabled: section.enabled,
    type: hasChildren ? 'category' : 'link'
  }

  if (hasChildren) {
    menuItem.children = section.items
      .filter(item => item.enabled !== false)
      .map(item => transformNavSection(item as NavMenuSection))
  }

  return menuItem
}

export const createSampleMenuData = (): MenuItem[] => [
  {
    title: "Getting Started",
    type: "category", 
    icon: "getting-started",
    children: [
      {
        title: "Installation",
        url: "/docs/getting-started/installation",
        type: "link"
      },
      {
        title: "Authentication",
        type: "category",
        children: [
          {
            title: "Email Auth",
            url: "/docs/auth/email",
            type: "link"
          },
          {
            title: "Social Auth",
            type: "category",
            children: [
              {
                title: "Google",
                url: "/docs/auth/google",
                type: "link"
              },
              {
                title: "GitHub", 
                url: "/docs/auth/github",
                type: "link"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: "Database",
    type: "category",
    icon: "database", 
    children: [
      {
        title: "Tables",
        url: "/docs/database/tables",
        type: "link"
      },
      {
        title: "Functions",
        url: "/docs/database/functions", 
        type: "link"
      }
    ]
  }
]
