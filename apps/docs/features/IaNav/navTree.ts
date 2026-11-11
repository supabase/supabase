import type {
  DropdownMenuItem,
  GlobalMenuItems,
  NavMenuConstant,
  NavMenuSection,
} from '@/components/Navigation/Navigation.types'

export type NavTreeNode = {
  label: string
  route?: string
  children?: NavTreeNode[]
}

export type NavTree = {
  name: string
  root: { label: string; children: NavTreeNode[] }
}

type MenuEntry = Partial<NavMenuSection>

const isEnabled = (item: { enabled?: boolean }) => item.enabled !== false

function isRenderable(entry: MenuEntry): boolean {
  if (!isEnabled(entry)) return false
  if (entry.url) return true
  return entry.items?.some((child) => isRenderable(child)) ?? false
}

function entryNode(entry: MenuEntry): NavTreeNode {
  const children = (entry.items ?? []).filter((child) => isRenderable(child))
  if (children.length === 0) return { label: entry.name ?? '', route: entry.url }
  return { label: entry.name ?? '', children: children.map((child) => entryNode(child)) }
}

function isMenu(value: unknown): value is NavMenuConstant {
  return typeof value === 'object' && value !== null && 'title' in value && 'items' in value
}

function dropdownItemNode(item: DropdownMenuItem, menus: Record<string, unknown>): NavTreeNode {
  const menu = item.level ? menus[item.level] : undefined
  if (!isMenu(menu) || !isEnabled(menu)) return { label: item.label, route: item.href }

  const entries = menu.items.filter((entry) => isRenderable(entry))
  if (entries.length <= 1) return { label: item.label, route: item.href }

  const group = entries.find((entry) => entry.name === item.label && entry.items?.length)
  if (group) {
    const { children } = entryNode(group)
    return { label: item.label, route: item.href, children }
  }

  return {
    label: item.label,
    route: menu.url ?? item.href,
    children: entries.map((entry) => entryNode(entry)),
  }
}

export function buildNavTree(name: string, menus: Record<string, unknown>): NavTree {
  const globalMenu = menus.GLOBAL_MENU_ITEMS as GlobalMenuItems

  const children = globalMenu.flat().flatMap((item): NavTreeNode[] => {
    if (!isEnabled(item)) return []
    if (!item.menuItems) return [dropdownItemNode(item, menus)]
    return [
      {
        label: item.label,
        children: item.menuItems
          .flat()
          .filter((child) => isEnabled(child) && child.href)
          .map((child) => dropdownItemNode(child, menus)),
      },
    ]
  })

  return { name, root: { label: 'Supabase Docs', children } }
}
