import { z } from 'zod'

export const contentListingItemSchema = z.object({
  title: z.string().min(1),
  href: z.string().min(1),
  description: z.string().min(1),
})

export const contentListingGroupTypeSchema = z.enum(['list', 'grid'])

export const contentListingGridColumnsSchema = z.union([z.literal(2), z.literal(3), z.literal(4)])

export const contentListingGroupSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: contentListingGroupTypeSchema.optional(),
  columns: contentListingGridColumnsSchema.optional(),
  id: z.string().min(1).optional(),
  items: z.array(contentListingItemSchema).min(1),
})

export const contentListingsSchema = z.array(contentListingGroupSchema).min(1)

export type ContentListingItem = z.infer<typeof contentListingItemSchema>
export type ContentListingGroup = z.infer<typeof contentListingGroupSchema>
export type ContentListingGridColumns = z.infer<typeof contentListingGridColumnsSchema>
export type ContentListings = z.infer<typeof contentListingsSchema>

/** Tailwind grid item classes for each supported column count (12-column grid). */
export const CONTENT_LISTING_GRID_ITEM_CLASS: Record<ContentListingGridColumns, string> = {
  2: 'col-span-12 md:col-span-6',
  3: 'col-span-12 md:col-span-4',
  4: 'col-span-12 md:col-span-3',
}

export function getContentListingGridItemClassName(columns: ContentListingGridColumns = 2): string {
  return CONTENT_LISTING_GRID_ITEM_CLASS[columns]
}

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
    if (group.columns !== undefined && group.type !== 'grid') {
      throw new Error(
        `Invalid contentListings group "${group.title}": columns is only valid when type is grid`
      )
    }

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
