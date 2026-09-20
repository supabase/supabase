import { z } from 'zod'

import {
  contentListingGridColumnsSchema,
  contentListingGroupSchema,
  contentListingGroupTypeSchema,
  contentListingHeadingLevelSchema,
  contentListingIconSchema,
  contentListingItemSchema,
} from './content-listings.zod.mjs'

export {
  contentListingGridColumnsSchema,
  contentListingGroupSchema,
  contentListingGroupTypeSchema,
  contentListingHeadingLevelSchema,
  contentListingIconSchema,
  contentListingItemSchema,
}

export type ContentListingIcon = z.infer<typeof contentListingIconSchema>
export type ContentListingItem = z.infer<typeof contentListingItemSchema>
export type ContentListingGroup = z.infer<typeof contentListingGroupSchema>
