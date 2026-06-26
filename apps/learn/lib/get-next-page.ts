import { allDocs } from 'contentlayer/generated'
import { courses } from '@/config/docs'
import { SidebarNavItem } from '@/types/nav'

/**
 * Flattens the navigation structure to get all pages in order
 * Only includes items that have an href (leaf nodes)
 */
function flattenNavItems(items: SidebarNavItem[]): SidebarNavItem[] {
  const result: SidebarNavItem[] = []

  for (const item of items) {
    if (item.items && item.items.length > 0) {
      // Recursively process children first
      result.push(...flattenNavItems(item.items))
    } else if (item.href) {
      // Only add items with href (leaf nodes)
      result.push(item)
    }
  }

  return result
}

/**
 * Normalizes a slug/href for comparison
 */
export function normalizeSlug(slug: string): string {
  return slug.replace(/^\//, '').toLowerCase()
}

/**
 * Gets the next page in the navigation structure based on the current page slug
 */
export function getNextPage(
  currentSlug: string
): { title: string; href: string; description?: string; chapterNumber?: number } | null {
  // Flatten all navigation items
  const allPages = flattenNavItems(courses.items)

  // Normalize the current slug for comparison
  const normalizedCurrentSlug = normalizeSlug(currentSlug)

  // Find the current page index
  const currentIndex = allPages.findIndex((page) => {
    if (!page.href) return false
    const pageSlug = normalizeSlug(page.href)
    return pageSlug === normalizedCurrentSlug
  })

  // If current page not found or it's the last page, return null
  if (currentIndex === -1 || currentIndex === allPages.length - 1) {
    return null
  }

  // Get the next page
  const nextPage = allPages[currentIndex + 1]
  if (!nextPage || !nextPage.href) {
    return null
  }

  // Try to get description and chapterNumber from the doc
  const nextPageSlug = normalizeSlug(nextPage.href)
  const doc = allDocs.find((doc) => normalizeSlug(doc.slugAsParams) === nextPageSlug)
  const description = doc?.description || nextPage.title

  // Get chapterNumber from frontmatter first, then fallback to parsing from title
  // Using type assertion since contentlayer types may need regeneration
  let chapterNumber: number | undefined = (doc as any)?.chapterNumber
  if (!chapterNumber) {
    // Try to extract chapter number from title (e.g., "2: CSS Styling" -> 2)
    const chapterMatch = nextPage.title.match(/^(\d+):/)
    chapterNumber = chapterMatch ? parseInt(chapterMatch[1], 10) : undefined
  }

  return {
    title: nextPage.title,
    href: nextPage.href,
    description,
    chapterNumber,
  }
}
