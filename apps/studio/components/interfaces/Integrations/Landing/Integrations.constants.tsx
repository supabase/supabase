import { Clock5, Layers, Vault, Webhook } from 'lucide-react'
import Image from 'next/image'
import { ReactNode } from 'react'

import { WRAPPERS } from 'components/interfaces/Database/Wrappers/Wrappers.constants'
import { WrapperMeta } from 'components/interfaces/Database/Wrappers/Wrappers.types'
import { BASE_PATH } from 'lib/constants'
import { cn } from 'ui'

export type IntegrationDefinition = {
  id: string
  name: string
  beta?: boolean
  icon: (props?: { className?: string; style?: Record<string, any> }) => ReactNode
  description: string
  docsUrl: string
  author: {
    name: string
    websiteUrl: string
  }
} & (
  | { type: 'wrapper'; meta: WrapperMeta }
  | { type: 'postgres_extension'; requiredExtensions: string[] }
  | { type: 'custom' }
)

const authorSupabase = {
  name: 'Supabase',
  websiteUrl: 'https://supabase.com',
}

type WrapperLabel = (typeof WRAPPERS)[number]['label']

export const WRAPPER_HANDLERS: Record<WrapperLabel, string> = {
  Stripe: 'Payment processing and subscription management',
  Firebase: 'Backend-as-a-Service with real-time database',
  S3: 'Cloud object storage service',
  ClickHouse: 'Column-oriented analytics database',
  BigQuery: 'Serverless data warehouse and analytics',
  Airtable: 'No-code database and spreadsheet platform',
  Logflare: 'Log management and analytics service',
  Auth0: 'Identity and access management platform',
  Cognito: 'AWS user authentication and authorization',
  'Microsoft SQL Server': 'Microsoft SQL Server database',
  Redis: 'In-memory data structure store',
  Paddle: 'Subscription billing and payments platform',
  Snowflake: 'Cloud data warehouse platform',
} as const

const supabaseIntegrations: IntegrationDefinition[] = [
  {
    id: 'queues',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pgmq'],
    name: `Queues`,
    icon: ({ className, ...props } = {}) => (
      <Layers className={cn('inset-0 p-2 text-background w-full h-full', className)} {...props} />
    ),
    description: 'Lightweight message queue in Postgres',
    docsUrl: 'https://github.com/tembo-io/pgmq',
    author: {
      name: 'pgmq',
      websiteUrl: 'https://github.com/tembo-io/pgmq',
    },
  },
  {
    id: 'cron-jobs',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pg_cron'],
    name: `Cron Jobs`,
    icon: ({ className, ...props } = {}) => (
      <Clock5 className={cn('inset-0 p-2 text-background w-full h-full', className)} {...props} />
    ),
    description: 'Schedule and automate tasks to run maintenance routines at specified intervals.',
    docsUrl: 'https://github.com/citusdata/pg_cron',
    author: {
      name: 'pg_cron',
      websiteUrl: 'https://github.com/citusdata/pg_cron',
    },
  },
  {
    id: 'vault',
    type: 'postgres_extension' as const,
    requiredExtensions: ['supabase_vault'],
    name: `Vault`,
    beta: true,
    icon: ({ className, ...props } = {}) => (
      <Vault className={cn('inset-0 p-2 text-background w-full h-full', className)} {...props} />
    ),
    description: 'Application level encryption for your project',
    docsUrl: 'https://supabase.com/docs',
    author: authorSupabase,
  },
  {
    id: 'webhooks',
    type: 'custom' as const,
    name: `Webhooks`,
    icon: ({ className, ...props } = {}) => (
      <Webhook className={cn('inset-0 p-2 text-background w-full h-full', className)} {...props} />
    ),
    description:
      'Send real-time data from your database to another system when a table event occurs',
    docsUrl: 'https://supabase.com/docs',
    author: authorSupabase,
  },
  {
    id: 'graphiql',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pg_graphql'],
    name: `GraphiQL`,
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
    docsUrl: 'https://supabase.com/docs',
    author: authorSupabase,
  },
] as const

const wrapperIntegrations: IntegrationDefinition[] = WRAPPERS.map((w) => {
  return {
    id: w.name,
    type: 'wrapper' as const,
    name: `${w.label} Wrapper`,
    icon: ({ className, ...props } = {}) => (
      <Image fill src={w.icon} alt={w.name} className={cn('p-2', className)} {...props} />
    ),
    description: WRAPPER_HANDLERS[w.label] || 'No description',
    docsUrl: w.docsUrl,
    meta: w,
    author: authorSupabase,
  }
})

export const INTEGRATIONS: IntegrationDefinition[] = [
  ...wrapperIntegrations,
  ...supabaseIntegrations,
]
