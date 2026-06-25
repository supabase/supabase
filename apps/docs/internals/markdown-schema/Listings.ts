import { getContentListingById } from '../../data/content-listings'
import { serializeContentListingGroupToMarkdown } from '../../lib/content-listings.markdown'
import { getInternalLinkBaseUrl } from '../internal-links'

/**
 * Markdown export handler for `<ContentListings id="..." />`. Looks up the
 * group by id in the same data registry the React component uses.
 */
export const ContentListings = ({ props }: { props: Record<string, unknown> }): string => {
  const id = typeof props.id === 'string' ? props.id : ''
  if (!id) return ''

  const group = getContentListingById(id)
  if (!group) return ''

  return serializeContentListingGroupToMarkdown(group, getInternalLinkBaseUrl())
}
