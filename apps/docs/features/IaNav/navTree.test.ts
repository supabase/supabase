import { describe, expect, it } from 'vitest'

import { buildNavTree, type NavTreeNode } from './navTree'
import * as option1NavItems from './option1.constants'
import * as currentNavItems from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'

describe('buildNavTree', () => {
  it('uses the top nav as the first level', () => {
    const tree = buildNavTree('today', currentNavItems)

    expect(tree.name).toBe('today')
    expect(tree.root.label).toBe('Supabase Docs')
    expect(tree.root.children.map((node) => node.label)).toEqual([
      'Start',
      'Products',
      'Build',
      'Manage',
      'Reference',
      'Resources',
    ])
    expect(tree.root.children[0].route).toBe('/guides/getting-started')
  })

  it('places SSL enforcement under Manage today', () => {
    const tree = buildNavTree('today', currentNavItems)

    expect(pathsTo(tree.root, '/guides/platform/ssl-enforcement')).toEqual([
      ['Manage', 'Platform Management', 'Platform Configuration', 'SSL Enforcement'],
    ])
  })

  it('expands a top nav entry that names a sidebar group into that group only', () => {
    const tree = buildNavTree('option-1', option1NavItems)

    expect(pathsTo(tree.root, '/guides/platform/ssl-enforcement')).toEqual([
      ['Run and manage', 'Network, SSL and domains'],
      ['Run and manage', 'Network, SSL and domains', 'SSL enforcement'],
    ])
  })

  it.each([
    ['today', currentNavItems],
    ['option-1', option1NavItems],
  ])('is five levels deep in %s, counting the top nav as level one', (name, menus) => {
    const tree = buildNavTree(name, menus)

    expect(Math.max(...tree.root.children.map((node) => depth(node)))).toBe(5)
  })

  it('contains the source pages the evals start from today', () => {
    const tree = buildNavTree('today', currentNavItems)
    const routes = [
      '/guides/getting-started/api-keys',
      '/guides/deployment/going-into-prod',
      '/guides/database/postgres/postgres-log-config',
      '/guides/deployment/branching/integrations',
      '/guides/platform/temporary-access',
      '/guides/local-development/testing/overview',
    ]

    expect(routes.filter((route) => pathsTo(tree.root, route).length === 0)).toEqual([])
  })
})

function depth(node: NavTreeNode): number {
  return 1 + Math.max(0, ...(node.children ?? []).map((child) => depth(child)))
}

function pathsTo(node: NavTreeNode, route: string, path: string[] = []): string[][] {
  const here = node.route === route ? [path] : []
  return [
    ...here,
    ...(node.children ?? []).flatMap((child) => pathsTo(child, route, [...path, child.label])),
  ]
}
