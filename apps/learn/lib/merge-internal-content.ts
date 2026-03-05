import { SidebarNavItem } from '@/types/nav'

/**
 * Get all hrefs from navigation items (only direct children, not nested)
 */
function getNavHrefsInSection(items?: SidebarNavItem[]): Set<string> {
  const hrefs = new Set<string>()
  if (!items) return hrefs

  items.forEach((item) => {
    if (item.href) {
      hrefs.add(item.href)
    }
  })

  return hrefs
}

/**
 * Merge orphaned internal content into their respective parent sections
 * For example, if /internal/foundations/grafana exists but /foundations/grafana doesn't,
 * it will be added to the end of the Foundations section
 */
export function mergeInternalContentIntoSections(
  navItems: SidebarNavItem[],
  internalPaths: string[]
): SidebarNavItem[] {
  return navItems.map((parentItem) => {
    // If this item doesn't have children, return as is
    if (!parentItem.items) return parentItem

    // Get the section path (e.g., "/foundations" from parent href)
    const parentPath = parentItem.href
    if (!parentPath) return parentItem

    // Get all existing hrefs in this section
    const existingHrefs = getNavHrefsInSection(parentItem.items)

    // Find orphaned internal items that belong to this section
    const orphanedItems: SidebarNavItem[] = []

    internalPaths.forEach((internalPath) => {
      // Check if this internal path belongs to this parent section
      // e.g., /foundations/grafana belongs to /foundations
      if (internalPath.startsWith(parentPath + '/')) {
        // Check if there's no corresponding public item
        const publicPath = internalPath // e.g., /foundations/grafana
        if (!existingHrefs.has(publicPath)) {
          // Extract the title from the path
          const pathParts = internalPath.split('/').filter(Boolean)
          const fileName = pathParts[pathParts.length - 1]

          // Convert kebab-case to Title Case
          const title = fileName
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')

          orphanedItems.push({
            title,
            href: `/internal${internalPath}`,
            requiresAuth: true,
          })
        }
      }
    })

    // If there are orphaned items, add them to the end of this section with a heading
    if (orphanedItems.length > 0) {
      // Create a separator item for "Internal Resources"
      const internalResourcesHeading: SidebarNavItem = {
        title: 'Internal Resources',
        href: undefined,
        items: orphanedItems.sort((a, b) => a.title.localeCompare(b.title)),
      }

      return {
        ...parentItem,
        items: [...parentItem.items, internalResourcesHeading],
      }
    }

    return parentItem
  })
}
