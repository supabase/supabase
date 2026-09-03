import type { ContentListingGroup } from '~/lib/content-listings.schema'

import { aiToolsBuildingIntoApp, aiToolsSupportedAgents } from './ai-tools.data'
import { authGetStarted, authNextSteps, authPricing } from './auth.data'
import { databaseGetStarted, databaseMultigresWhatYouGet, databaseNextSteps } from './database.data'
import {
  functionsExamplesAiMedia,
  functionsExamplesMessaging,
  functionsExamplesOperations,
  functionsExamplesSupabase,
  functionsExamplesWebhooksPayments,
  functionsGetStarted,
} from './functions.data'
import {
  gettingStartedFrameworkQuickstarts,
  gettingStartedMobileTutorials,
  gettingStartedOverview,
  gettingStartedUseCases,
  gettingStartedWebAppDemos,
} from './getting-started.data'
import { logDrainsDestinations } from './log-drains.data'
import { realtimeExamples, realtimeGetStarted, realtimeResources } from './realtime.data'
import { resourcesMigrate, resourcesOverview, resourcesPostgres } from './resources.data'
import {
  selfHostingCommunity,
  selfHostingGetStarted,
  selfHostingSupport,
} from './self-hosting.data'
import { storageExamples, storageGetStarted, storageResources } from './storage.data'
import { telemetryDebugging, telemetryMonitoring } from './telemetry.data'

const ALL_GROUPS: readonly ContentListingGroup[] = [
  aiToolsSupportedAgents,
  aiToolsBuildingIntoApp,
  authGetStarted,
  authPricing,
  authNextSteps,
  databaseGetStarted,
  databaseMultigresWhatYouGet,
  databaseNextSteps,
  functionsGetStarted,
  functionsExamplesSupabase,
  functionsExamplesWebhooksPayments,
  functionsExamplesAiMedia,
  functionsExamplesMessaging,
  functionsExamplesOperations,
  gettingStartedOverview,
  gettingStartedUseCases,
  gettingStartedFrameworkQuickstarts,
  gettingStartedWebAppDemos,
  gettingStartedMobileTutorials,
  logDrainsDestinations,
  realtimeGetStarted,
  realtimeExamples,
  realtimeResources,
  resourcesOverview,
  resourcesMigrate,
  resourcesPostgres,
  selfHostingGetStarted,
  selfHostingCommunity,
  selfHostingSupport,
  storageGetStarted,
  storageExamples,
  storageResources,
  telemetryDebugging,
  telemetryMonitoring,
]

export const CONTENT_LISTINGS: Readonly<Record<string, ContentListingGroup>> = Object.fromEntries(
  ALL_GROUPS.map((group) => [group.id, group])
)
