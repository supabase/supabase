import { describe, expect, it } from 'vitest'

import * as option1 from './option1.constants'
import * as today from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'

type NavNode = {
  name?: string
  url?: string
  href?: string
  items?: NavNode[]
  menuItems?: NavNode[][]
}

const nodes = (node: NavNode): NavNode[] => [
  node,
  ...(node.items ?? []).flatMap((child) => nodes(child)),
]

const walk = (node: NavNode): string[] => [
  ...[node.url, node.href].filter((url): url is string => Boolean(url)),
  ...(node.items ?? []).flatMap((child) => walk(child)),
  ...(node.menuItems ?? []).flat().flatMap((child) => walk(child)),
]

function sidebarUrls(navItems: Record<string, unknown>): string[] {
  // A sidebar shared by several URL prefixes is exported under each name.
  const sidebars = new Set(
    Object.values(navItems).filter(
      (value): value is NavNode =>
        typeof value === 'object' && value !== null && 'title' in value && 'items' in value
    )
  )

  return [...sidebars].flatMap((sidebar) => (sidebar.items ?? []).flatMap((item) => walk(item)))
}

function navUrls(navItems: Record<string, unknown>): string[] {
  return [
    ...(navItems.GLOBAL_MENU_ITEMS as NavNode[][]).flat().flatMap((item) => walk(item)),
    ...sidebarUrls(navItems),
  ]
}

describe('Option 1 navigation', () => {
  // These topics link to a section of their source page. When a topic gets its own page,
  // fix its link in the sidebar and remove it from this test.
  it('links each new topic without a page to the section it comes from', () => {
    const links = Object.values(option1 as Record<string, unknown>)
      .filter((value): value is NavNode => typeof value === 'object' && value !== null)
      .flatMap((sidebar) => nodes(sidebar))
      .map((node) => [node.name, node.url])

    expect(links).toEqual(
      expect.arrayContaining([
        ['Production security checklist', '/guides/deployment/going-into-prod#security'],
        [
          'Log slow and failing queries',
          '/guides/database/postgres/postgres-log-config#logmindurationstatement',
        ],
        ['Query plans with explain()', '/guides/database/debugging-performance#using-explain'],
        ['Preview branches on Vercel', '/guides/deployment/branching/integrations#vercel'],
        [
          'Map team members to Postgres roles',
          '/guides/platform/temporary-access#configure-user-access',
        ],
        [
          'Test RLS policies with pgTAP',
          '/guides/local-development/testing/overview#database-unit-testing-with-pgtap',
        ],
      ])
    )
  })

  it('lists each page once across its sidebars', () => {
    const urls = sidebarUrls(option1)

    expect(urls.filter((url, index) => urls.indexOf(url) !== index)).toEqual([])
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
