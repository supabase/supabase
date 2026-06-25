import { z } from 'zod'

import {
  contentListingGridColumnsSchema,
  contentListingGroupSchema,
  contentListingGroupTypeSchema,
  contentListingHeadingLevelSchema,
  contentListingItemSchema,
} from './content-listings.zod.mjs'

export {
  contentListingGridColumnsSchema,
  contentListingGroupSchema,
  contentListingGroupTypeSchema,
  contentListingHeadingLevelSchema,
  contentListingItemSchema,
}

export type ContentListingItem = z.infer<typeof contentListingItemSchema>
export type ContentListingGroup = z.infer<typeof contentListingGroupSchema>
export type ContentListingGridColumns = z.infer<typeof contentListingGridColumnsSchema>

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

/** Label for telemetry and keys — prefers heading, falls back to id. */
export function getContentListingGroupLabel(group: ContentListingGroup): string {
  return group.heading ?? group.id ?? 'content-listing'
}

/**
 * Returns true when the href is an absolute http(s) URL.
 */
export function isExternalContentListingHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
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
