import { describe, expect, it } from 'vitest'

import * as option1 from './option1.constants'
import * as today from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'

type NavNode = {
  title?: string
  name?: string
  url?: string
  href?: string
  items?: NavNode[]
  menuItems?: NavNode[][]
}

const walk = (node: NavNode): string[] => [
  ...[node.url, node.href].filter((url): url is string => Boolean(url)),
  ...(node.items ?? []).flatMap((child) => walk(child)),
  ...(node.menuItems ?? []).flat().flatMap((child) => walk(child)),
]

const names = (node: NavNode): string[] => [
  ...(node.name ? [node.name] : []),
  ...(node.items ?? []).flatMap((child) => names(child)),
]

// A sidebar shared by several URL prefixes is exported under each name.
const sidebars = (navItems: Record<string, unknown>): NavNode[] => [
  ...new Set(
    Object.values(navItems).filter(
      (value): value is NavNode =>
        typeof value === 'object' && value !== null && 'title' in value && 'items' in value
    )
  ),
]

function sidebarUrls(navItems: Record<string, unknown>): string[] {
  return sidebars(navItems).flatMap((sidebar) =>
    (sidebar.items ?? []).flatMap((item) => walk(item))
  )
}

function navUrls(navItems: Record<string, unknown>): string[] {
  return [
    ...(navItems.GLOBAL_MENU_ITEMS as NavNode[][]).flat().flatMap((item) => walk(item)),
    ...sidebarUrls(navItems),
  ]
}

describe('Option 1 navigation', () => {
  it('lists each page once across its sidebars', () => {
    const urls = sidebarUrls(option1)

    expect(urls.filter((url, index) => urls.indexOf(url) !== index)).toEqual([])
  })

  it('keeps every sidebar label to 28 characters or fewer', () => {
    const labels = sidebars(option1).flatMap((sidebar) => [
      sidebar.title ?? '',
      ...(sidebar.items ?? []).flatMap((item) => names(item)),
    ])

    expect(labels.filter((label) => label.length > 28)).toEqual([])
  })

  it("links only to pages already in today's navigation", () => {
    const page = (url: string) => url.split('#')[0]
    const todayPages = new Set(navUrls(today).map((url) => page(url)))
    // the migration guides moved to the knowledge base
    const isKbPage = (url: string) => url.startsWith('https://supabase.com/kb/')

    expect(navUrls(option1).filter((url) => !isKbPage(url) && !todayPages.has(page(url)))).toEqual(
      []
    )
  })
})
