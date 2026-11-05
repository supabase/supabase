import type { ContentListingGroup } from '~/lib/content-listings.schema'
import { getFederatedContentListingItems } from '~/lib/federated-content-listing.utils'

import { ContentListings } from './ContentListings.client'

/**
 * `<ContentListings>` whose items come from an external repo at build time.
 * `id` names a source in `scripts/federated-content-listing/sources`.
 */
export function FederatedContentListing(props: Omit<ContentListingGroup, 'items'>) {
  return <ContentListings group={{ ...props, items: getFederatedContentListingItems(props.id) }} />
}
