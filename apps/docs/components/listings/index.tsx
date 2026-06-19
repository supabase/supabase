import { createListingComponent } from './createListingComponent'
import { LISTINGS_MARKDOWN_REGISTRY } from './listings-markdown-registry'

export {
  LISTINGS_MARKDOWN_REGISTRY,
  type ListingsMarkdownComponentName,
} from './listings-markdown-registry'

export const AuthGetStartedListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.AuthGetStartedListings
)
export const AuthPricingListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.AuthPricingListings
)
export const AuthNextStepsListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.AuthNextStepsListings
)

export const StorageGetStartedListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.StorageGetStartedListings
)
export const StorageExamplesListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.StorageExamplesListings
)
export const StorageResourcesListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.StorageResourcesListings
)

export const DatabaseGetStartedListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.DatabaseGetStartedListings
)
export const DatabaseNextStepsListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.DatabaseNextStepsListings
)

export const GettingStartedGetStartedListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.GettingStartedGetStartedListings
)

export const RealtimeGetStartedListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.RealtimeGetStartedListings
)
export const RealtimeExamplesListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.RealtimeExamplesListings
)
export const RealtimeResourcesListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.RealtimeResourcesListings
)

export const FunctionsGetStartedListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.FunctionsGetStartedListings
)
export const FunctionsExamplesSupabaseListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.FunctionsExamplesSupabaseListings
)
export const FunctionsExamplesWebhooksPaymentsListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.FunctionsExamplesWebhooksPaymentsListings
)
export const FunctionsExamplesAiMediaListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.FunctionsExamplesAiMediaListings
)
export const FunctionsExamplesMessagingListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.FunctionsExamplesMessagingListings
)
export const FunctionsExamplesOperationsListings = createListingComponent(
  LISTINGS_MARKDOWN_REGISTRY.FunctionsExamplesOperationsListings
)
