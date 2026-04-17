import { getEnableWebhooksSQL } from '@supabase/pg-meta'
import { Clock5, Code2, Layers, Timer, Vault, Webhook } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { ComponentType, ReactNode } from 'react'
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

export type Navigation = {
  route: string
  label: string
  hasChild?: boolean
  childIcon?: React.ReactNode
  children?: Navigation[]
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

type InstallUrlType = 'get' | 'post'

type InstallIdentificationMethod = 'secret_key_prefix'

/**
 * [Joshen] For marketplace, we probably need to revisit this definition
 * What properties are obsolete, what properties we need from remote source
 */
export type IntegrationDefinition = {
  id: string
  name: string
  status?: 'alpha' | 'beta'
  categories?: string[]
  icon: (props?: { className?: string; style?: Record<string, string | number> }) => ReactNode
  description: string | null
  content?: string | null
  files?: string[]
  docsUrl: string | null
  siteUrl?: string | null
  author: {
    name: string
    websiteUrl: string
  }
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
  listingId?: string
} & (
  | { type: 'wrapper'; meta: WrapperMeta }
  | { type: 'postgres_extension' | 'custom' | 'oauth' | 'template' }
)

const authorSupabase = {
  name: 'Supabase',
  websiteUrl: 'https://supabase.com',
}

const SUPABASE_INTEGRATIONS: Array<IntegrationDefinition> = [
  {
    id: 'queues',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pgmq'],
    missingExtensionsAlert: <UpgradeDatabaseAlert minimumVersion="15.6.1.143" />,
    name: `Queues`,
    icon: ({ className, ...props } = {}) => (
      <Layers className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
    ),
    description: 'Lightweight message queue in Postgres',
    docsUrl: 'https://github.com/tembo-io/pgmq',
    author: {
      name: 'pgmq',
      websiteUrl: 'https://github.com/tembo-io/pgmq',
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
          <Layers size={12} strokeWidth={1.5} className={cn('text-foreground w-full h-full')} />
        ),
      },
      {
        route: 'settings',
        label: 'Settings',
      },
    ],
    navigate: ({ pageId = 'overview', childId }) => {
      if (childId) {
        return dynamic(() => import('../Queues/QueuePage').then((mod) => mod.QueuePage), {
          loading: Loading,
        })
      }
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/Queues/OverviewTab').then(
                (mod) => mod.QueuesOverviewTab
              ),
            { loading: Loading }
          )
        case 'queues':
          return dynamic(() => import('../Queues/QueuesTab').then((mod) => mod.QueuesTab), {
            loading: Loading,
          })
        case 'settings':
          return dynamic(
            () => import('../Queues/QueuesSettings').then((mod) => mod.QueuesSettings),
            { loading: Loading }
          )
      }
      return null
    },
  },
  {
    id: 'cron',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pg_cron'],
    name: `Cron`,
    icon: ({ className, ...props } = {}) => (
      <Clock5 className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
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
          <Timer size={12} strokeWidth={1.5} className={cn('text-foreground w-full h-full')} />
        ),
      },
    ],
    navigate: ({ pageId = 'overview', childId }) => {
      if (childId) {
        return dynamic(() => import('../CronJobs/CronJobPage').then((mod) => mod.CronJobPage), {
          loading: Loading,
        })
      }
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/Integration/IntegrationOverviewTabWrapper').then(
                (mod) => mod.IntegrationOverviewTabWrapper
              ),
            {
              loading: Loading,
            }
          )
        case 'jobs':
          return dynamic(() => import('../CronJobs/CronJobsTab').then((mod) => mod.CronjobsTab), {
            loading: Loading,
          })
      }
      return null
    },
  },
  {
    id: 'vault',
    type: 'postgres_extension' as const,
    requiredExtensions: ['supabase_vault'],
    missingExtensionsAlert: <UpgradeDatabaseAlert />,
    name: `Vault`,
    status: 'beta',
    icon: ({ className, ...props } = {}) => (
      <Vault className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
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
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/Integration/IntegrationOverviewTabWrapper').then(
                (mod) => mod.IntegrationOverviewTabWrapper
              ),
            {
              loading: Loading,
            }
          )
        case 'secrets':
          return dynamic(
            () => import('../Vault/Secrets/SecretsManagement').then((mod) => mod.SecretsManagement),
            {
              loading: Loading,
            }
          )
      }
      return null
    },
  },
  {
    id: 'webhooks',
    type: 'postgres_extension' as const,
    name: `Database Webhooks`,
    icon: ({ className, ...props } = {}) => (
      <Webhook className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
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
      },
    ],
    navigate: ({ pageId = 'overview' }) => {
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/Webhooks/OverviewTab').then(
                (mod) => mod.WebhooksOverviewTab
              ),
            {
              loading: Loading,
            }
          )
        case 'webhooks':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/Webhooks/ListTab').then(
                (mod) => mod.WebhooksListTab
              ),
            {
              loading: Loading,
            }
          )
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
    requiredExtensions: [],
    name: `Data API`,
    icon: ({ className, ...props } = {}) => (
      <Code2 className={cn('inset-0 p-2 text-black w-full h-full', className)} {...props} />
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
      },
      {
        route: 'docs',
        label: 'Docs',
      },
    ],
    navigate: ({ pageId = 'overview' }) => {
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/DataApi/OverviewTab').then(
                (mod) => mod.DataApiOverviewTab
              ),
            {
              loading: Loading,
            }
          )
        case 'settings':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/DataApi/SettingsTab').then(
                (mod) => mod.DataApiSettingsTab
              ),
            {
              loading: Loading,
            }
          )
        case 'docs':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/DataApi/DocsTab').then(
                (mod) => mod.DataApiDocsTab
              ),
            {
              loading: Loading,
            }
          )
      }
      return null
    },
  },
  {
    id: 'graphiql',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pg_graphql'],
    name: `GraphQL`,
    icon: ({ className, ...props } = {}) => (
      <Image
        fill
        src={`${BASE_PATH}/img/graphql.svg`}
        alt="GraphiQL"
        className={cn('p-2', className)}
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
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/Integration/IntegrationOverviewTabWrapper').then(
                (mod) => mod.IntegrationOverviewTabWrapper
              ),
            {
              loading: Loading,
            }
          )
        case 'graphiql':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/GraphQL/GraphiQLTab').then(
                (mod) => mod.GraphiQLTab
              ),
            {
              loading: Loading,
            }
          )
      }
      return null
    },
  },
] as const

const WRAPPER_INTEGRATIONS: Array<IntegrationDefinition> = WRAPPERS.map((w) => {
  return {
    id: w.name,
    type: 'wrapper' as const,
    name: `${w.label} Wrapper`,
    icon: ({ className, ...props } = {}) => (
      <Image fill src={w.icon} alt={w.name} className={cn('p-2', className)} {...props} />
    ),
    requiredExtensions: ['wrappers', 'supabase_vault'],
    description: w.description,
    docsUrl: w.docsUrl,
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
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/Wrappers/OverviewTab').then(
                (mod) => mod.WrapperOverviewTab
              ),
            {
              loading: Loading,
            }
          )
        case 'wrappers':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/Wrappers/WrappersTab').then(
                (mod) => mod.WrappersTab
              ),
            {
              loading: Loading,
            }
          )
      }
      return null
    },
  }
})

const TEMPLATE_INTEGRATIONS: Array<IntegrationDefinition> = [
  {
    id: 'stripe_sync_engine',
    type: 'template' as const,
    requiredExtensions: ['pgmq', 'supabase_vault', 'pg_cron', 'pg_net'],
    missingExtensionsAlert: <UpgradeDatabaseAlert minimumVersion="15.6.1.143" />,
    name: `Stripe Sync Engine`,
    status: 'alpha',
    icon: ({ className, ...props } = {}) => (
      <Image
        fill
        src={`${BASE_PATH}/img/icons/stripe-icon.svg`}
        alt={'Stripe Logo'}
        className={cn('p-2', className)}
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
      },
    ],
    navigate: ({ pageId = 'overview' }) => {
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/templates/StripeSyncEngine/OverviewTab').then(
                (mod) => mod.StripeSyncEngineOverviewTab
              ),
            { loading: Loading }
          )
        case 'settings':
          return dynamic(
            () =>
              import('@/components/interfaces/Integrations/templates/StripeSyncEngine/StripeSyncSettingsPage').then(
                (mod) => mod.StripeSyncSettingsPage
              ),
            { loading: Loading }
          )
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

      if (track) track('integration_install_submitted', { integrationName: 'stripe_sync_engine' })

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

export const INTEGRATIONS: Array<IntegrationDefinition> = [
  ...WRAPPER_INTEGRATIONS,
  ...SUPABASE_INTEGRATIONS,
  ...TEMPLATE_INTEGRATIONS,
]

export const Loading = () => (
  <div className="p-10">
    <GenericSkeletonLoader />
  </div>
)
