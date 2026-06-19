import type { ContentListingGroup } from '~/lib/content-listings.schema'

import { ContentListings } from '../ContentListings'

/**
 * Creates a zero-prop MDX component that renders a content listing from shared data.
 */
export function createListingComponent(group: ContentListingGroup) {
  function ListingComponent() {
    return <ContentListings {...group} />
  }

  return ListingComponent
}
