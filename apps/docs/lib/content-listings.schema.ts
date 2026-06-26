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

/** Label for telemetry — prefers heading, falls back to id. */
export function getContentListingGroupLabel(group: ContentListingGroup): string {
  return group.heading ?? group.id
}

export function isExternalContentListingHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}
