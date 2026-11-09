import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { contentListingItemSchema, type ContentListingItem } from './content-listings.schema'
import { GENERATED_DIRECTORY } from './docs'

export const FEDERATED_CONTENT_LISTING_DIRECTORY = join(
  GENERATED_DIRECTORY,
  'federated-content-listing'
)

/**
 * Reads the items `build:federated-content-listing` wrote for `id`. Shared by
 * the `<FederatedContentListing>` component and its markdown export handler.
 */
export function getFederatedContentListingItems(id: string): ContentListingItem[] {
  try {
    const raw = readFileSync(join(FEDERATED_CONTENT_LISTING_DIRECTORY, `${id}.json`), 'utf-8')
    return contentListingItemSchema.array().parse(JSON.parse(raw))
  } catch (error) {
    console.warn(
      `[federated-content-listing] Failed to read ${id}.json; rendering without it`,
      error
    )
    return []
  }
}
