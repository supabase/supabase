import type { ContentListingGroup } from '~/lib/content-listings.schema'
import { getFederatedContentListingItems } from '~/lib/federated-content-listing.utils'

import { getInternalLinkBaseUrl } from '../internal-links'
import { serializeContentListingGroupToMarkdown } from './ContentListings'

/**
 * Markdown export handler for `<FederatedContentListing id="..." />`. Reads
 * the same generated items the React component uses.
 */
export const FederatedContentListing = ({ props }: { props: Record<string, unknown> }): string => {
  const id = typeof props.id === 'string' ? props.id : ''
  if (!id) return ''

  const group = { ...props, id, items: getFederatedContentListingItems(id) } as ContentListingGroup
  return serializeContentListingGroupToMarkdown(group, getInternalLinkBaseUrl())
}
