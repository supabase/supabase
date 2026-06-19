import { LISTINGS_MARKDOWN_REGISTRY } from '../../components/listings/listings-markdown-registry'
import { serializeContentListingGroupToMarkdown } from '../../lib/content-listings.markdown'
import { getInternalLinkBaseUrl } from '../internal-links'

/**
 * Markdown export handlers for named listing components.
 * Each handler imports the same data module the React component uses.
 */
export const ListingsMarkdownHandlers = Object.fromEntries(
  Object.entries(LISTINGS_MARKDOWN_REGISTRY).map(([name, group]) => [
    name,
    () => serializeContentListingGroupToMarkdown(group, getInternalLinkBaseUrl()),
  ])
)
