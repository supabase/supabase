import { type ContentListingItem } from '~/lib/content-listings.schema'
import type { DocsContentListingClickedEvent } from 'common/telemetry-constants'

export function buildDocsContentListingClickedEvent({
  item,
  groupTitle,
  listingId,
}: {
  item: ContentListingItem
  groupTitle?: string
  listingId?: string
}): DocsContentListingClickedEvent {
  return {
    action: 'docs_content_listing_clicked',
    properties: {
      targetPath: item.href,
      linkTitle: item.title,
      ...(groupTitle ? { groupTitle } : {}),
      ...(listingId ? { listingId } : {}),
    },
  }
}
