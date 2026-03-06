import type { SubMenuSection } from 'components/ui/ProductMenu/ProductMenu.types'

import type { SidebarSection } from './AccountLayout.types'

/**
 * Converts AccountLayout SidebarSection[] to SubMenuSection[] for SubMenu/ProductMenu.
 * Defensive: handles missing or malformed sections/links.
 */
export function toSubMenuSections(sections: SidebarSection[]): SubMenuSection[] {
  if (!Array.isArray(sections)) return []
  return sections
    .filter((s): s is SidebarSection => s != null && typeof s === 'object')
    .map((s) => ({
      key: s.key ?? '',
      heading: s.heading,
      links: (s.links ?? [])
        .filter((l) => l != null && typeof l === 'object' && l.key && l.label != null)
        .map((l) => ({
          key: l.key,
          label: l.label,
          href: l.href,
        })),
    }))
    .filter((s) => s.key || s.heading)
}

/**
 * Returns the key of the first active link across all sections.
 * Used to highlight the current page in SubMenu.
 */
export function getActiveKey(sections: SidebarSection[]): string | undefined {
  if (!Array.isArray(sections)) return undefined
  for (const section of sections) {
    if (!section?.links || !Array.isArray(section.links)) continue
    const active = section.links.find((l) => l?.isActive === true)
    if (active?.key) return active.key
  }
  return undefined
}
