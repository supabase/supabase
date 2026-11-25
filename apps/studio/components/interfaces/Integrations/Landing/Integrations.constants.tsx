import { getEnableWebhooksSQL } from '@supabase/pg-meta'
import { ClientOnly } from '@tanstack/react-router'
import type { Tables } from 'common/marketplace.types'
import {
  Clock5Icon,
  Code2Icon,
  LayersIcon,
  TimerIcon,
  VaultIcon,
  WarehouseIcon,
  WebhookIcon,
} from 'lucide-react'
import { ComponentType, lazy, ReactNode } from 'react'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { UpgradeDatabaseAlert } from '../Queues/UpgradeDatabaseAlert'
import { getStripeSyncSchemaComment } from '../templates/StripeSyncEngine/useStripeSyncStatus'
import { WRAPPERS } from '../Wrappers/Wrappers.constants'
import { WrapperMeta } from '../Wrappers/Wrappers.types'
import { stripeSyncKeys } from '@/data/database-integrations/stripe/keys'
import { installStripeSync } from '@/data/database-integrations/stripe/stripe-sync-install-mutation'
import { enableDatabaseWebhooks } from '@/data/database/hooks-enable-mutation'
import { databaseKeys } from '@/data/database/keys'
import { getSchemas, invalidateSchemasQuery } from '@/data/database/schemas-query'
import { getQueryClient } from '@/data/query-client'
import { BASE_PATH, DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

export type NavigationContentLayout = 'constrained' | 'full'

export type Navigation = {
  route: string
  label: string
  hasChild?: boolean
  childIcon?: React.ReactNode
  children?: Navigation[]
  layout?: NavigationContentLayout // applies only to the new marketplace
}

// [Joshen] Basing this on template.json for now
export type IntegrationInputs = {
  [key: string]: {
    label: string
    type: 'text' | 'number' | 'password'
    description?: string
    required: boolean
    actions: {
      label: string
      href: string
    }[]
  }
}

type IntegrationStep = {
  label: string
  description?: string
}

type Listing = Tables<'listings'>
type InstallUrlType = NonNullable<Listing['installation_url_type']>
type InstallIdentificationMethod = NonNullable<Listing['installation_identification_method']>

export type MarketplaceSource = 'Official' | 'Partner' | 'Community'

/**
 * [Joshen] For marketplace, we probably need to revisit this definition
 * What properties are obsolete, what properties we need from remote source
 */
export type IntegrationDefinition = {
  id: string
  name: string
  status?: 'alpha' | 'beta'
  categories?: string[]
  featured?: boolean
  icon: (props?: { className?: string; style?: Record<string, string | number> }) => ReactNode
  description: string | null
  content?: string | null
  files?: { src: string; alt: string }[]
  docsUrl: string | null
  siteUrl?: string | null
  author: {
    name: string
    websiteUrl: string
  }
  /** Provenance of the integration — Official (built by Supabase), Partner (formal third-party listing), Community (open-source, not officially endorsed). */
  source: MarketplaceSource
  requiredExtensions: Array<string>
  /** Optional component to render if the integration requires extensions that are not available on the current database image */
  missingExtensionsAlert?: ReactNode
  navigation?: Array<Navigation>
  navigate: (props: {
    id: string | undefined
    pageId: string | undefined
    childId: string | undefined
  }) => ComponentType<{}> | null

  /** For showing the SQL query in the installation sheet */
  installationSql?: string
  /** Custom command to install the integration (if any - none atm) */
  installationCommand?: (props: {
    ref: string
    track?: ReturnType<typeof useTrack>
    [key: string]: unknown
  }) => Promise<void>
  /**
   * Used for long polling to track the progress of the integration installation if async
   * The component calling this handles the polling logic, and should terminate the poll depending on the returned value
   * Depending on how we want this to work, this method will thereafter also call any RQ invalidation if required
   * */
  checkInstallationStatus?: (props: {
    ref?: string
    connectionString?: string | null
    [key: string]: unknown
  }) => Promise<'installed' | 'installing'>
  /** User inputs for template integrations */
  inputs?: IntegrationInputs
  /** Purely visual, just to show what are the changes on the project from installing the integration */
  steps?: IntegrationStep[]

  /** These are for OAuth Integrations */
  installUrl?: string | null
  installUrlType?: InstallUrlType
  installIdentificationMethod?: InstallIdentificationMethod
  secretKeyPrefix?: string
  edgeFunctionSecretName?: string
  listingId?: string
  oauthAppId?: string
} & (
  | { type: 'wrapper'; meta: WrapperMeta }
  | { type: 'postgres_extension' | 'custom' | 'oauth' | 'template' }
)

const authorSupabase = {
  name: 'Supabase',
  websiteUrl: 'https://supabase.com',
}

const QueuePage = lazy(() =>
  import('../Queues/QueuePage').then((mod) => ({ default: mod.QueuePage }))
)
const QueuesOverviewTab = lazy(() =>
  import('@/components/interfaces/Integrations/Queues/OverviewTab').then((mod) => ({
    default: mod.QueuesOverviewTab,
  }))
)
const QueuesTab = lazy(() =>
  import('../Queues/QueuesTab').then((mod) => ({ default: mod.QueuesTab }))
)
const QueuesSettings = lazy(() =>
  import('../Queues/QueuesSettings').then((mod) => ({ default: mod.QueuesSettings }))
)

const CronJobPage = lazy(() =>
  import('../CronJobs/CronJobPage').then((mod) => ({ default: mod.CronJobPage }))
)
const CronOverviewTab = lazy(() =>
  import('@/components/interfaces/Integrations/CronJobs/OverviewTab').then((mod) => ({
    default: mod.CronOverviewTab,
  }))
)
const CronjobsTab = lazy(() =>
  import('../CronJobs/CronJobsTab').then((mod) => ({ default: mod.CronjobsTab }))
)

const VaultOverviewTab = lazy(() =>
  import('@/components/interfaces/Integrations/Vault/OverviewTab').then((mod) => ({
    default: mod.VaultOverviewTab,
  }))
)
const SecretsManagement = lazy(() =>
  import('../Vault/Secrets/SecretsManagement').then((mod) => ({ default: mod.SecretsManagement }))
)

const WebhooksOverviewTab = lazy(() =>
  import('@/components/interfaces/Integrations/Webhooks/OverviewTab').then((mod) => ({
    default: mod.WebhooksOverviewTab,
  }))
)
const WebhooksListTab = lazy(() =>
  import('@/components/interfaces/Integrations/Webhooks/ListTab').then((mod) => ({
    default: mod.WebhooksListTab,
  }))
)

const DataApiOverviewTab = lazy(() =>
  import('@/components/interfaces/Integrations/DataApi/OverviewTab').then((mod) => ({
    default: mod.DataApiOverviewTab,
  }))
)
const DataApiSettingsTab = lazy(() =>
  import('@/components/interfaces/Integrations/DataApi/SettingsTab').then((mod) => ({
    default: mod.DataApiSettingsTab,
  }))
)
const DataApiDocsTab = lazy(() =>
  import('@/components/interfaces/Integrations/DataApi/DocsTab').then((mod) => ({
    default: mod.DataApiDocsTab,
  }))
)

const WarehouseOverviewTab = lazy(() =>
  import('@/components/interfaces/Integrations/Warehouse/OverviewTab').then((mod) => ({
    default: mod.WarehouseOverviewTab,
  }))
)

const GraphQLOverviewTab = lazy(() =>
  import('@/components/interfaces/Integrations/GraphQL/OverviewTab').then((mod) => ({
    default: mod.GraphQLOverviewTab,
  }))
)
const LazyGraphiQLTab = lazy(() =>
  import('@/components/interfaces/Integrations/GraphQL/GraphiQLTab').then((mod) => ({
    default: mod.GraphiQLTab,
  }))
)
const GraphiQLTab = () => (
  <ClientOnly fallback={<Loading />}>
    <LazyGraphiQLTab />
  </ClientOnly>
)

const WrapperOverviewTab = lazy(() =>
  import('@/components/interfaces/Integrations/Wrappers/OverviewTab').then((mod) => ({
    default: mod.WrapperOverviewTab,
  }))
)
const WrappersTab = lazy(() =>
  import('@/components/interfaces/Integrations/Wrappers/WrappersTab').then((mod) => ({
    default: mod.WrappersTab,
  }))
)

const StripeSyncEngineOverviewTab = lazy(() =>
  import('@/components/interfaces/Integrations/templates/StripeSyncEngine/OverviewTab').then(
    (mod) => ({ default: mod.StripeSyncEngineOverviewTab })
  )
)
const StripeSyncSettingsPage = lazy(() =>
  import('@/components/interfaces/Integrations/templates/StripeSyncEngine/StripeSyncSettingsPage').then(
    (mod) => ({ default: mod.StripeSyncSettingsPage })
  )
)

const SUPABASE_INTEGRATIONS: Array<IntegrationDefinition> = [
  {
    id: 'queues',
    type: 'postgres_extension' as const,
    source: 'Community' as const,
    requiredExtensions: ['pgmq'],
    missingExtensionsAlert: <UpgradeDatabaseAlert minimumVersion="15.6.1.143" />,
    name: `Queues`,
    icon: ({ className, ...props } = {}) => (
      <LayersIcon className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
    ),
    description: 'Lightweight message queue in Postgres',
    docsUrl: 'https://github.com/pgmq/pgmq',
    author: {
      name: 'pgmq',
      websiteUrl: 'https://github.com/pgmq/pgmq',
    },
    navigation: [
      {
        route: 'overview',
        label: 'Overview',
      },
      {
        route: 'queues',
        label: 'Queues',
        hasChild: true,
        childIcon: (
          <LayersIcon size={12} strokeWidth={1.5} className={cn('text-foreground w-full h-full')} />
        ),
      },
      {
        route: 'settings',
        label: 'Settings',
        layout: 'constrained',
      },
    ],
    navigate: ({ pageId = 'overview', childId }) => {
      if (childId) {
        return QueuePage
      }
      switch (pageId) {
        case 'overview':
          return QueuesOverviewTab
        case 'queues':
          return QueuesTab
        case 'settings':
          return QueuesSettings
      }
      return null
    },
  },
  {
    id: 'cron',
    type: 'postgres_extension' as const,
    source: 'Community' as const,
    requiredExtensions: ['pg_cron'],
    name: `Cron`,
    icon: ({ className, ...props } = {}) => (
      <Clock5Icon className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
    ),
    description: 'Schedule recurring Jobs in Postgres',
    docsUrl: 'https://github.com/citusdata/pg_cron',
    author: {
      name: 'Citus Data',
      websiteUrl: 'https://github.com/citusdata/pg_cron',
    },
    navigation: [
      {
        route: 'overview',
        label: 'Overview',
      },
      {
        route: 'jobs',
        label: 'Jobs',
        hasChild: true,
        childIcon: (
          <TimerIcon size={12} strokeWidth={1.5} className={cn('text-foreground w-full h-full')} />
        ),
      },
    ],
    navigate: ({ pageId = 'overview', childId }) => {
      if (childId) {
        return CronJobPage
      }
      switch (pageId) {
        case 'overview':
          return CronOverviewTab
        case 'jobs':
          return CronjobsTab
      }
      return null
    },
  },
  {
    id: 'vault',
    type: 'postgres_extension' as const,
    source: 'Official' as const,
    requiredExtensions: ['supabase_vault'],
    missingExtensionsAlert: <UpgradeDatabaseAlert />,
    name: `Vault`,
    status: 'beta',
    icon: ({ className, ...props } = {}) => (
      <VaultIcon className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
    ),
    description: 'Application level encryption for your project',
    docsUrl: `${DOCS_URL}/guides/database/vault`,
    author: authorSupabase,
    navigation: [
      {
        route: 'overview',
        label: 'Overview',
      },
      {
        route: 'secrets',
        label: 'Secrets',
      },
    ],
    navigate: ({ pageId = 'overview' }) => {
      switch (pageId) {
        case 'overview':
          return VaultOverviewTab
        case 'secrets':
          return SecretsManagement
      }
      return null
    },
  },
  {
    id: 'webhooks',
    type: 'postgres_extension' as const,
    source: 'Official' as const,
    name: `Database Webhooks`,
    icon: ({ className, ...props } = {}) => (
      <WebhookIcon className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
    ),
    description:
      'Send real-time data from your database to another system when a table event occurs',
    docsUrl: `${DOCS_URL}/guides/database/webhooks`,
    author: authorSupabase,
    requiredExtensions: ['pg_net'],
    navigation: [
      {
        route: 'overview',
        label: 'Overview',
      },
      {
        route: 'webhooks',
        label: 'Webhooks',
        layout: 'constrained',
      },
    ],
    navigate: ({ pageId = 'overview' }) => {
      switch (pageId) {
        case 'overview':
          return WebhooksOverviewTab
        case 'webhooks':
          return WebhooksListTab
      }
      return null
    },
    installationSql: getEnableWebhooksSQL(),
    installationCommand: async ({ ref }: { ref: string }) => {
      const queryClient = getQueryClient()
      await enableDatabaseWebhooks({ ref })
      await invalidateSchemasQuery(queryClient, ref)
    },
  },
  {
    id: 'data_api',
    type: 'custom' as const,
    source: 'Official' as const,
    requiredExtensions: [],
    name: `Data API`,
    icon: ({ className, ...props } = {}) => (
      <Code2Icon className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
    ),
    description: 'Auto-generate an API directly from your database schema',
    docsUrl: `${DOCS_URL}/guides/api`,
    author: authorSupabase,
    navigation: [
      {
        route: 'overview',
        label: 'Overview',
      },
      {
        route: 'settings',
        label: 'Settings',
        layout: 'constrained',
      },
      {
        route: 'docs',
        label: 'Docs',
      },
    ],
    navigate: ({ pageId = 'overview' }) => {
      switch (pageId) {
        case 'overview':
          return DataApiOverviewTab
        case 'settings':
          return DataApiSettingsTab
        case 'docs':
          return DataApiDocsTab
      }
      return null
    },
  },
  {
    id: 'warehouse',
    type: 'custom' as const,
    source: 'Official' as const,
    status: 'alpha' as const,
    requiredExtensions: [],
    name: `Warehouse`,
    icon: ({ className, ...props } = {}) => (
      <WarehouseIcon className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
    ),
    description: 'Replicate your database to an analytical endpoint',
    // No Warehouse guide exists yet. Point this at `${DOCS_URL}/guides/warehouse` once one does.
    docsUrl: null,
    author: authorSupabase,
    navigation: [
      {
        route: 'overview',
        label: 'Overview',
      },
    ],
    navigate: ({ pageId = 'overview' }) => {
      if (pageId === 'overview') {
        return WarehouseOverviewTab
      }
      return null
    },
  },
  {
    id: 'graphiql',
    type: 'postgres_extension' as const,
    source: 'Official' as const,
    requiredExtensions: ['pg_graphql'],
    name: `GraphQL`,
    icon: ({ className, ...props } = {}) => (
      <img
        src={`${BASE_PATH}/img/graphql.svg`}
        alt="GraphiQL"
        className={cn('w-full h-full p-2', className)}
        {...props}
      />
    ),
    description: 'Run GraphQL queries through our interactive in-browser IDE',
    docsUrl: `${DOCS_URL}/guides/database/extensions/pg_graphql`,
    author: authorSupabase,
    navigation: [
      {
        route: 'overview',
        label: 'Overview',
      },
      {
        route: 'graphiql',
        label: 'GraphiQL',
      },
    ],
    navigate: ({ pageId = 'overview' }) => {
      switch (pageId) {
        case 'overview':
          return GraphQLOverviewTab
        case 'graphiql':
          return GraphiQLTab
      }
      return null
    },
  },
] as const

const WRAPPER_INTEGRATIONS: Array<IntegrationDefinition> = WRAPPERS.map((w) => {
  return {
    id: w.name,
    type: 'wrapper' as const,
    source: 'Official' as const,
    name: `${w.label} Wrapper`,
    icon: ({ className, ...props } = {}) => (
      <img src={w.icon} alt={w.name} className={cn('w-full h-full p-2', className)} {...props} />
    ),
    requiredExtensions: ['wrappers', 'supabase_vault'],
    description: w.description,
    docsUrl: w.docsUrl,
    categories: w.categories,
    meta: w,
    author: authorSupabase,
    navigation: [
      {
        route: 'overview',
        label: 'Overview',
      },
      {
        route: 'wrappers',
        label: 'Wrappers',
      },
    ],
    navigate: ({ pageId = 'overview' }) => {
      switch (pageId) {
        case 'overview':
          return WrapperOverviewTab
        case 'wrappers':
          return WrappersTab
      }
      return null
    },
  }
})

const TEMPLATE_INTEGRATIONS: Array<IntegrationDefinition> = [
  {
    id: 'stripe_sync_engine',
    type: 'template' as const,
    source: 'Partner' as const,
    requiredExtensions: ['pgmq', 'supabase_vault', 'pg_cron', 'pg_net'],
    missingExtensionsAlert: <UpgradeDatabaseAlert minimumVersion="15.6.1.143" />,
    name: `Stripe Sync Engine`,
    status: 'alpha',
    icon: ({ className, ...props } = {}) => (
      <img
        src={`${BASE_PATH}/img/icons/stripe-icon.svg`}
        alt={'Stripe Logo'}
        className={cn('w-full h-full p-2', className)}
        {...props}
      />
    ),
    description:
      'Continuously sync your payments, customer, and other data from Stripe to your Postgres database',
    docsUrl: 'https://github.com/stripe-experiments/sync-engine/',
    author: {
      name: 'Stripe',
      websiteUrl: 'https://www.stripe.com',
    },
    navigation: [
      {
        route: 'overview',
        label: 'Overview',
      },
      {
        route: 'settings',
        label: 'Settings',
        layout: 'constrained',
      },
    ],
    navigate: ({ pageId = 'overview' }) => {
      switch (pageId) {
        case 'overview':
          return StripeSyncEngineOverviewTab
        case 'settings':
          return StripeSyncSettingsPage
      }
      return null
    },
    inputs: {
      stripe_api_key: {
        type: 'password',
        required: true,
        label: 'Stripe API secret key',
        description:
          'Requires write access to Webhook Endpoints and read-only access to all other categories.',
        actions: [
          {
            label: 'Get API key',
            href: 'https://dashboard.stripe.com/apikeys',
          },
          {
            label: 'What are Stripe API keys?',
            href: 'https://support.stripe.com/questions/what-are-stripe-api-keys-and-how-to-find-them',
          },
        ],
      },
    },
    steps: [
      { label: 'Creates a new database schema named `stripe`' },
      { label: 'Creates tables and views in the `stripe` schema for synced Stripe data' },
      { label: 'Deploys Edge Functions to handle incoming webhooks from Stripe' },
      { label: 'Schedules automatic Stripe data syncs using Supabase Queues' },
    ],
    installationCommand: async ({ ref: projectRef, track, stripe_api_key }) => {
      const startTime = Date.now()
      await installStripeSync({ projectRef, startTime, stripeSecretKey: stripe_api_key as string })

      if (track)
        track('integration_install_submitted', {
          integrationName: 'stripe_sync_engine',
          method: 'template',
        })

      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: stripeSyncKeys.all })
    },
    checkInstallationStatus: async (props) => {
      const queryClient = getQueryClient()
      const { projectRef, connectionString } = props || {}

      const schemas = await getSchemas({
        projectRef: projectRef as string,
        connectionString: connectionString as string,
      })

      const { status, errorMessage } = getStripeSyncSchemaComment(schemas)

      if (status === 'install error') {
        throw new Error(errorMessage ?? 'Stripe Sync installation failed')
      }

      if (status === 'installed') {
        await queryClient.invalidateQueries({
          queryKey: databaseKeys.schemas(projectRef as string),
        })
      }
      return status === 'installed' ? 'installed' : 'installing'
    },
  },
]

const INTEGRATIONS_WITH_CATEGORIES = [
  ...WRAPPER_INTEGRATIONS,
  ...SUPABASE_INTEGRATIONS.map((integration) => {
    const categoryMap: Record<string, string[]> = {
      queues: ['devtools'],
      cron: ['devtools'],
      vault: ['security'],
      webhooks: ['api'],
      data_api: ['api', 'data-platform'],
      warehouse: ['data-platform'],
      graphiql: ['api', 'devtools'],
    }
    return {
      ...integration,
      categories: categoryMap[integration.id] || [],
    }
  }),
  ...TEMPLATE_INTEGRATIONS.map((integration) => {
    const categoryMap: Record<string, string[]> = {
      stripe_sync_engine: ['billing'],
    }
    return {
      ...integration,
      categories: categoryMap[integration.id] || [],
    }
  }),
]

export const INTEGRATIONS: Array<IntegrationDefinition> = INTEGRATIONS_WITH_CATEGORIES

export const Loading = () => (
  <div className="p-10">
    <GenericSkeletonLoader />
  </div>
)
