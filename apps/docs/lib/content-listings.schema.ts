import { z } from 'zod'

export const contentListingItemSchema = z.object({
  title: z.string().min(1),
  href: z.string().min(1),
  description: z.string().min(1),
})

export const contentListingGroupTypeSchema = z.enum(['list', 'grid'])

export const contentListingGroupSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: contentListingGroupTypeSchema.optional(),
  id: z.string().min(1).optional(),
  items: z.array(contentListingItemSchema).min(1),
})

export const contentListingsSchema = z.array(contentListingGroupSchema).min(1)

export type ContentListingItem = z.infer<typeof contentListingItemSchema>
export type ContentListingGroup = z.infer<typeof contentListingGroupSchema>
export type ContentListings = z.infer<typeof contentListingsSchema>

const INTERNAL_HREF_PATTERN = /^\/(docs\/)?(guides|dashboard)\//

export function isValidContentListingHref(href: string): boolean {
  return INTERNAL_HREF_PATTERN.test(href)
}

/**
 * Normalize guide hrefs for Next.js Link (strip /docs prefix when present).
 */
export function normalizeContentListingHref(href: string): string {
  if (href.startsWith('/docs/guides/')) {
    return href.replace(/^\/docs/, '')
  }
  return href
}

export function parseContentListings(value: unknown): ContentListings | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  const parsed = contentListingsSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error(`Invalid contentListings front matter: ${parsed.error.message}`)
  }

  for (const group of parsed.data) {
    for (const item of group.items) {
      if (!isValidContentListingHref(item.href)) {
        throw new Error(
          `Invalid contentListings href "${item.href}": must start with /guides/, /docs/guides/, or /dashboard/`
        )
      }
    }
  }

  return parsed.data
}

export function resolveContentListingGroup(
  groups: ContentListings,
  listing?: string
): ContentListingGroup[] {
  if (!listing) {
    return groups
  }

  const matched = groups.filter((group) => group.id === listing)
  if (matched.length === 0) {
    throw new Error(`No contentListings group found with id "${listing}"`)
  }

  return matched
}
