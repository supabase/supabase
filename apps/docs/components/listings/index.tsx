import { createListingComponent } from './createListingComponent'
import {
  LISTINGS_MARKDOWN_REGISTRY,
  type ListingsMarkdownComponentName,
} from './listings-markdown-registry'

export {
  LISTINGS_MARKDOWN_REGISTRY,
  type ListingsMarkdownComponentName,
} from './listings-markdown-registry'

type ListingMdxComponent = ReturnType<typeof createListingComponent>

/** Named listing components for MDX — built from the markdown registry. */
export const listingMdxComponents = Object.fromEntries(
  Object.entries(LISTINGS_MARKDOWN_REGISTRY).map(([name, group]) => [
    name,
    createListingComponent(group),
  ])
) as Record<ListingsMarkdownComponentName, ListingMdxComponent>
