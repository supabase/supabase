import Image from 'next/image'

import { WRAPPERS } from 'components/interfaces/Database/Wrappers/Wrappers.constants'
import { WrapperMeta } from 'components/interfaces/Database/Wrappers/Wrappers.types'
import { BASE_PATH } from 'lib/constants'
import { Clock5, Layers, Vault, Webhook } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from 'ui'

export type IntegrationDefinition = {
  id: string
  name: string
  icon: (props?: { className?: string; style?: Record<string, any> }) => ReactNode
  description: string
  docsUrl: string
  author: {
    name: string
    docsUrl: string
    websiteUrl: string
  }
} & (
  | { type: 'wrapper'; meta: WrapperMeta }
  | { type: 'postgres_extension'; requiredExtensions: string[] }
  | { type: 'custom' }
)

const authorSupabase = {
  name: 'Supabase',
  docsUrl: 'https://supabase.com/docs',
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
    icon: ({ className, ...rest } = {}) => (
      <Layers
        className={cn('absolute inset-0 p-2 text-background w-full h-full', className)}
        {...rest}
      />
    ),
    description: 'Lightweight message queue in Postgres',
    docsUrl: '',
    author: authorSupabase,
  },
  {
    id: 'cron-jobs',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pg_cron'],
    name: `Cron Jobs`,
    icon: ({ className, ...rest } = {}) => (
      <Clock5
        className={cn('absolute inset-0 p-2 text-background w-full h-full', className)}
        {...rest}
      />
    ),
    description: 'cron-based scheduler in Postgres',
    docsUrl: '',
    author: authorSupabase,
  },
  {
    id: 'vault',
    type: 'postgres_extension' as const,
    requiredExtensions: ['supabase_vault'],
    name: `Vault`,
    icon: ({ className, ...rest } = {}) => (
      <Vault
        className={cn('absolute inset-0 p-2 text-background w-full h-full', className)}
        {...rest}
      />
    ),
    description: 'Application level encryption for your project',
    docsUrl: '',
    author: authorSupabase,
  },
  {
    id: 'webhooks',
    type: 'custom' as const,
    name: `Webhooks`,
    icon: ({ className, ...rest } = {}) => (
      <Webhook
        className={cn('absolute inset-0 p-2 text-background w-full h-full', className)}
        {...rest}
      />
    ),
    description:
      'Send real-time data from your database to another system whenever a table event occurs',
    docsUrl: '',
    author: authorSupabase,
  },
  {
    id: 'graphiql',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pg_graphql'],
    name: `GraphiQL`,
    icon: ({ className, ...rest } = {}) => (
      <Image
        fill
        src={`${BASE_PATH}/img/graphql.svg`}
        alt="GraphiQL"
        className={cn('p-2', className)}
        {...rest}
      />
    ),
    description: 'In-browser IDE for GraphQL',
    docsUrl: '',
    author: authorSupabase,
  },
] as const

const wrapperIntegrations: IntegrationDefinition[] = WRAPPERS.map((w) => {
  return {
    id: w.name,
    type: 'wrapper' as const,
    name: `${w.label} Wrapper`,
    icon: ({ className, ...rest } = {}) => (
      <Image fill src={w.icon} alt={w.name} className={cn('p-2', className)} {...rest} />
    ),
    description: WRAPPER_HANDLERS[w.label] || 'No description',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/stripe',
    meta: w,
    author: authorSupabase,
  }
})

export const INTEGRATIONS: IntegrationDefinition[] = [
  ...wrapperIntegrations,
  ...supabaseIntegrations,
]
