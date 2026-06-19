import { z } from 'zod'

import {
  contentListingGridColumnsSchema,
  contentListingGroupSchema,
  contentListingGroupTypeSchema,
  contentListingHeadingLevelSchema,
  contentListingItemSchema,
  contentListingsSchema,
} from './content-listings.zod.mjs'

export {
  contentListingGridColumnsSchema,
  contentListingGroupSchema,
  contentListingGroupTypeSchema,
  contentListingHeadingLevelSchema,
  contentListingItemSchema,
  contentListingsSchema,
}

export type ContentListingItem = z.infer<typeof contentListingItemSchema>
export type ContentListingGroup = z.infer<typeof contentListingGroupSchema>
export type ContentListingGridColumns = z.infer<typeof contentListingGridColumnsSchema>
export type ContentListingHeadingLevel = z.infer<typeof contentListingHeadingLevelSchema>
export type ContentListings = z.infer<typeof contentListingsSchema>

/** Tailwind grid item classes for each supported column count (12-column grid). */
export const CONTENT_LISTING_GRID_ITEM_CLASS: Record<ContentListingGridColumns, string> = {
  2: 'col-span-12 md:col-span-6',
  3: 'col-span-12 md:col-span-4',
  4: 'col-span-12 md:col-span-3',
}

/**
 * Returns Tailwind column classes for a grid listing group.
 */
export function getContentListingGridItemClassName(columns: ContentListingGridColumns = 3): string {
  return CONTENT_LISTING_GRID_ITEM_CLASS[columns]
}

const HEADING_LEVEL_TAG: Record<ContentListingHeadingLevel, 'h2' | 'h3' | 'h4'> = {
  '##': 'h2',
  '###': 'h3',
  '####': 'h4',
}

/**
 * Maps a contentListings heading level marker to an HTML heading tag.
 */
export function getContentListingHeadingTag(
  headingLevel: ContentListingHeadingLevel = '##'
): 'h2' | 'h3' | 'h4' {
  return HEADING_LEVEL_TAG[headingLevel]
}

/** Label for telemetry and keys — prefers heading, falls back to id. */
export function getContentListingGroupLabel(group: ContentListingGroup): string {
  return group.heading ?? group.id
}

const INTERNAL_HREF_PATTERN = /^\/(docs\/)?(guides|dashboard)\//

/**
 * Returns true when the href is an absolute http(s) URL.
 */
export function isExternalContentListingHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

/**
 * Returns true when the href is an allowed internal docs path or external URL.
 */
export function isValidContentListingHref(href: string): boolean {
  return INTERNAL_HREF_PATTERN.test(href) || isExternalContentListingHref(href)
}

/**
 * Normalize internal hrefs for Next.js Link (strip /docs prefix when present).
 * External hrefs are returned unchanged.
 */
export function normalizeContentListingHref(href: string): string {
  if (isExternalContentListingHref(href)) {
    return href
  }
  if (href.startsWith('/docs/')) {
    return href.replace(/^\/docs/, '')
  }
  return href
}

function normalizeContentListingGroupInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw
  }

  const obj = { ...(raw as Record<string, unknown>) }

  if ('heading-level' in obj && !('headingLevel' in obj)) {
    obj.headingLevel = obj['heading-level']
    delete obj['heading-level']
  }

  return obj
}

/**
 * Parse and validate contentListings front matter.
 *
 * @throws If the value is present but invalid (schema, href, or columns rules).
 */
export function parseContentListings(value: unknown): ContentListings | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  const normalized = Array.isArray(value) ? value.map(normalizeContentListingGroupInput) : value

  const parsed = contentListingsSchema.safeParse(normalized)
  if (!parsed.success) {
    throw new Error(`Invalid contentListings front matter: ${parsed.error.message}`)
  }

  for (const group of parsed.data) {
    if (group.columns !== undefined && group.type !== 'grid') {
      throw new Error(
        `Invalid contentListings group "${group.id}": columns is only valid when type is grid`
      )
    }

    for (const item of group.items) {
      if (!isValidContentListingHref(item.href)) {
        throw new Error(
          `Invalid contentListings href "${item.href}": must start with /guides/, /docs/guides/, /dashboard/, or https://`
        )
      }
    }
  }

  return parsed.data
}

/**
 * Resolves a single listing group by id, or returns all groups when id is omitted.
 *
 * @throws If listing is set but no group matches the id.
 */
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
