import type { ContentListingGroup } from '~/lib/content-listings.schema'

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
import { realtimeExamples, realtimeGetStarted, realtimeResources } from './realtime.data'
import {
  selfHostingCommunity,
  selfHostingGetHelp,
  selfHostingGetStarted,
  selfHostingResolveIssues,
  selfHostingShareExperience,
} from './self-hosting.data'
import { storageExamples, storageGetStarted, storageResources } from './storage.data'

const ALL_GROUPS: readonly ContentListingGroup[] = [
  authGetStarted,
  authPricing,
  authNextSteps,
  databaseGetStarted,
  databaseNextSteps,
  functionsGetStarted,
  functionsExamplesSupabase,
  functionsExamplesWebhooksPayments,
  functionsExamplesAiMedia,
  functionsExamplesMessaging,
  functionsExamplesOperations,
  realtimeGetStarted,
  realtimeExamples,
  realtimeResources,
  selfHostingGetStarted,
  selfHostingCommunity,
  selfHostingResolveIssues,
  selfHostingGetHelp,
  selfHostingShareExperience,
  storageGetStarted,
  storageExamples,
  storageResources,
]

export const CONTENT_LISTINGS: Readonly<Record<string, ContentListingGroup>> = Object.fromEntries(
  ALL_GROUPS.map((group) => [group.id, group])
)
