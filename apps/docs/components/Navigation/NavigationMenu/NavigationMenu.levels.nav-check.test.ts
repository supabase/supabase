import { describe, expect, it } from 'vitest'

import type { GlobalMenuItems } from '../Navigation.types'
import * as currentNavItems from './NavigationMenu.constants'
import * as option1NavItems from '@/features/IaNav/option1.constants'

const MAX_ITEMS = 9

type Level = { path: string; size: number }
type NavNode = { name?: string; items?: NavNode[] }

function sidebarLevels(path: string, items: NavNode[]): Level[] {
  return [
    { path, size: items.length },
    ...items.flatMap((item) =>
      item.items?.length ? sidebarLevels(`${path} > ${item.name}`, item.items) : []
    ),
  ]
}

function topNavLevels(menu: GlobalMenuItems): Level[] {
  return [
    { path: 'Top nav', size: menu.length },
    ...menu.flatMap(([item]) =>
      (item.menuItems ?? []).map((column, index) => ({
        path: `Top nav > ${item.label} > column ${index + 1}`,
        size: column.length,
      }))
    ),
  ]
}

function oversizedLevels(navItems: Record<string, unknown>): string[] {
  // A sidebar shared by several URL prefixes is exported under each name.
  const sidebars = new Set(
    Object.values(navItems).filter(
      (value): value is { title: string; items: NavNode[] } =>
        typeof value === 'object' &&
        value !== null &&
        'title' in value &&
        Array.isArray((value as { items?: unknown }).items)
    )
  )

  return [
    ...topNavLevels(navItems.GLOBAL_MENU_ITEMS as GlobalMenuItems),
    ...[...sidebars].flatMap((sidebar) => sidebarLevels(sidebar.title, sidebar.items)),
  ]
    .filter((level) => level.size > MAX_ITEMS)
    .map((level) => level.path)
}

// Levels allowed 10 or more items, such as a list of peers like quickstarts or providers.
const ALLOWLIST = [
  'Auth',
  'Auth > Flows (How-tos)',
  'Auth > Flows (How-tos) > Social Sign-in (OAuth)',
  'Database',
  'Database > Extensions',
  'Database > Foreign Data Wrappers > Sources',
  'Database > Working with your database (intermediate)',
  'Edge Functions',
  'Edge Functions > Examples',
  'Edge Functions > Third-Party Tools',
  'Platform > Billing > Manage your usage',
  'Platform > Platform Configuration',
  'Self-Hosting',
  'Self-Hosting > How-to Guides',
  'Start with Supabase > Framework Quickstarts',
  'Start with Supabase > Web app demos',
  'Storage > File Buckets',
]
const OPTION_1_ALLOWLIST = [
  'Auth > Social Sign-in (OAuth)',
  'Database > Foreign Data Wrappers > Apps and APIs',
  'Database > Foreign Data Wrappers > Databases and warehouses',
  'Start > Framework Quickstarts > JavaScript and TypeScript',
  'Start > Web app demos',
]

describe('navigation level size', () => {
  it.each([
    ["today's navigation", currentNavItems, ALLOWLIST],
    ['Option 1', option1NavItems, OPTION_1_ALLOWLIST],
  ])('%s has no level with 10 or more items outside the allowlist', (_, navItems, allowlist) => {
    expect(oversizedLevels(navItems).sort()).toEqual([...allowlist].sort())
  })
})
