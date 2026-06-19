import { authGetStarted, authNextSteps, authPricing } from './auth.data'
import { databaseGetStarted, databaseNextSteps } from './database.data'
import {
  functionsExamplesAiMedia,
  functionsExamplesMessaging,
  functionsExamplesOperations,
  functionsExamplesSupabase,
  functionsExamplesWebhooksPayments,
  functionsGetStarted,
} from './functions.data'
import { gettingStartedGetStarted } from './getting-started.data'
import { realtimeExamples, realtimeGetStarted, realtimeResources } from './realtime.data'
import { storageExamples, storageGetStarted, storageResources } from './storage.data'

/** Maps MDX component names to listing data for web and markdown export. */
export const LISTINGS_MARKDOWN_REGISTRY = {
  AuthGetStartedListings: authGetStarted,
  AuthPricingListings: authPricing,
  AuthNextStepsListings: authNextSteps,
  StorageGetStartedListings: storageGetStarted,
  StorageExamplesListings: storageExamples,
  StorageResourcesListings: storageResources,
  DatabaseGetStartedListings: databaseGetStarted,
  DatabaseNextStepsListings: databaseNextSteps,
  GettingStartedGetStartedListings: gettingStartedGetStarted,
  RealtimeGetStartedListings: realtimeGetStarted,
  RealtimeExamplesListings: realtimeExamples,
  RealtimeResourcesListings: realtimeResources,
  FunctionsGetStartedListings: functionsGetStarted,
  FunctionsExamplesSupabaseListings: functionsExamplesSupabase,
  FunctionsExamplesWebhooksPaymentsListings: functionsExamplesWebhooksPayments,
  FunctionsExamplesAiMediaListings: functionsExamplesAiMedia,
  FunctionsExamplesMessagingListings: functionsExamplesMessaging,
  FunctionsExamplesOperationsListings: functionsExamplesOperations,
} as const

export type ListingsMarkdownComponentName = keyof typeof LISTINGS_MARKDOWN_REGISTRY
