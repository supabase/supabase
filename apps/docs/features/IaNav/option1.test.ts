import { describe, expect, it } from 'vitest'

import * as option1 from './option1.constants'
import * as today from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'

type NavNode = { url?: string; href?: string; items?: NavNode[]; menuItems?: NavNode[][] }

function navUrls(navItems: Record<string, unknown>): string[] {
  const walk = (node: NavNode): string[] => [
    ...[node.url, node.href].filter((url): url is string => Boolean(url)),
    ...(node.items ?? []).flatMap((child) => walk(child)),
    ...(node.menuItems ?? []).flat().flatMap((child) => walk(child)),
  ]
  // A sidebar shared by several URL prefixes is exported under each name.
  const sidebars = new Set(
    Object.values(navItems).filter(
      (value): value is NavNode =>
        typeof value === 'object' && value !== null && 'title' in value && 'items' in value
    )
  )

  return [
    ...(navItems.GLOBAL_MENU_ITEMS as NavNode[][]).flat().flatMap((item) => walk(item)),
    ...[...sidebars].flatMap((sidebar) => walk(sidebar)),
  ]
}

describe('Option 1 navigation', () => {
  it("links only to URLs already in today's navigation", () => {
    const todayUrls = new Set(navUrls(today))

    expect(navUrls(option1).filter((url) => !todayUrls.has(url))).toEqual([])
  })

  it('reads Start, Build, Develop and deploy, Run and manage, Self-Hosting, Reference, and Resources at the top level', () => {
    expect(option1.GLOBAL_MENU_ITEMS.map(([item]) => item.label)).toEqual([
      'Start',
      'Build',
      'Develop and deploy',
      'Run and manage',
      'Self-Hosting',
      'Reference',
      'Resources',
    ])
  })

  it.each(['platform', 'security', 'telemetry'] as const)(
    'shows the Run and manage groups in the %s sidebar',
    (menuId) => {
      expect(option1[menuId].title).toBe('Run and manage')
      expect(option1[menuId].items.map((item) => item.name)).toEqual([
        'Projects, compute and scaling',
        'Network, SSL and domains',
        'Team',
        'Security and compliance',
        'Backups, restore and upgrades',
        'Billing and usage',
        'Logs and monitoring',
      ])
    }
  )
})
