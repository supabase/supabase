import { Clock5, Code2, Layers, Timer, Vault, Webhook } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { ComponentType, ReactNode } from 'react'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { UpgradeDatabaseAlert } from '../Queues/UpgradeDatabaseAlert'
import { WRAPPERS } from '../Wrappers/Wrappers.constants'
import { WrapperMeta } from '../Wrappers/Wrappers.types'
import { BASE_PATH, DOCS_URL } from '@/lib/constants'

export type Navigation = {
  route: string
  label: string
  hasChild?: boolean
  childIcon?: React.ReactNode
  children?: Navigation[]
}

const Loading = () => (
  <div className="p-10">
    <GenericSkeletonLoader />
  </div>
)

export type IntegrationDefinition = {
  id: string
  name: string
  status?: 'alpha' | 'beta'
  icon: (props?: { className?: string; style?: Record<string, any> }) => ReactNode
  description: string
  docsUrl: string
  author: {
    name: string
    websiteUrl: string
  }
  requiredExtensions: Array<string>
  /** Optional component to render if the integration requires extensions that are not available on the current database image */
  missingExtensionsAlert?: ReactNode
  navigation?: Array<Navigation>
  navigate: (
    id: string,
    pageId: string | undefined,
    childId: string | undefined
  ) => ComponentType<{}> | null
} & ({ type: 'wrapper'; meta: WrapperMeta } | { type: 'postgres_extension' } | { type: 'custom' })

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
    navigate: (id: string, pageId: string = 'overview', childId: string | undefined) => {
      if (childId) {
        return dynamic(() => import('../Queues/QueuePage').then((mod) => mod.QueuePage), {
          loading: Loading,
        })
      }
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Queues/OverviewTab').then(
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
    navigate: (id: string, pageId: string = 'overview', childId: string | undefined) => {
      if (childId) {
        return dynamic(() => import('../CronJobs/CronJobPage').then((mod) => mod.CronJobPage), {
          loading: Loading,
        })
      }
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Integration/IntegrationOverviewTab').then(
                (mod) => mod.IntegrationOverviewTab
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
    docsUrl: DOCS_URL,
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
    navigate: (id: string, pageId: string = 'overview', childId: string | undefined) => {
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Integration/IntegrationOverviewTab').then(
                (mod) => mod.IntegrationOverviewTab
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
    docsUrl: DOCS_URL,
    author: authorSupabase,
    requiredExtensions: [],
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
    navigate: (id: string, pageId: string = 'overview', childId: string | undefined) => {
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Webhooks/OverviewTab').then(
                (mod) => mod.WebhooksOverviewTab
              ),
            {
              loading: Loading,
            }
          )
        case 'webhooks':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Webhooks/ListTab').then(
                (mod) => mod.WebhooksListTab
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
    navigate: (_id: string, pageId: string = 'overview', _childId: string | undefined) => {
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/DataApi/OverviewTab').then(
                (mod) => mod.DataApiOverviewTab
              ),
            {
              loading: Loading,
            }
          )
        case 'settings':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/DataApi/SettingsTab').then(
                (mod) => mod.DataApiSettingsTab
              ),
            {
              loading: Loading,
            }
          )
        case 'docs':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/DataApi/DocsTab').then(
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
    docsUrl: DOCS_URL,
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
    navigate: (id: string, pageId: string = 'overview', childId: string | undefined) => {
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Integration/IntegrationOverviewTab').then(
                (mod) => mod.IntegrationOverviewTab
              ),
            {
              loading: Loading,
            }
          )
        case 'graphiql':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/GraphQL/GraphiQLTab').then(
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
    navigate: (id: string, pageId: string = 'overview', childId: string | undefined) => {
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Wrappers/OverviewTab').then(
                (mod) => mod.WrapperOverviewTab
              ),
            {
              loading: Loading,
            }
          )
        case 'wrappers':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Wrappers/WrappersTab').then(
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
    type: 'custom' as const,
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
    navigate: (_id: string, pageId: string = 'overview', _childId: string | undefined) => {
      switch (pageId) {
        case 'overview':
          return dynamic(
            () =>
              import(
                'components/interfaces/Integrations/templates/StripeSyncEngine/InstallationOverview'
              ).then((mod) => mod.StripeSyncInstallationPage),
            { loading: Loading }
          )
        case 'settings':
          return dynamic(
            () =>
              import(
                'components/interfaces/Integrations/templates/StripeSyncEngine/StripeSyncSettingsPage'
              ).then((mod) => mod.StripeSyncSettingsPage),
            { loading: Loading }
          )
      }
      return null
    },
  },
]

export const INTEGRATIONS: Array<IntegrationDefinition> = [
  ...WRAPPER_INTEGRATIONS,
  ...SUPABASE_INTEGRATIONS,
  ...TEMPLATE_INTEGRATIONS,
]
