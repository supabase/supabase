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
