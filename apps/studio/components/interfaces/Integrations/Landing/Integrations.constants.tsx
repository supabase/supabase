import Image from 'next/image'

import { WRAPPERS } from 'components/interfaces/Database/Wrappers/Wrappers.constants'
import { WrapperMeta } from 'components/interfaces/Database/Wrappers/Wrappers.types'
import { BASE_PATH } from 'lib/constants'
import { Clock5, Layers, Vault, Webhook } from 'lucide-react'
import { ReactNode } from 'react'

export type IntegrationDefinition = {
  id: string
  name: string
  icon: ReactNode
  description: string
  docsUrl: string
} & (
  | { type: 'wrapper'; meta: WrapperMeta }
  | { type: 'postgres_extension'; requiredExtensions: string[] }
  | { type: 'custom' }
)

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
    icon: <Layers className="absolute inset-0 p-2 text-background w-full h-full" />,
    description: 'Lightweight message queue in Postgres',
    docsUrl: '',
  },
  {
    id: 'cron-jobs',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pg_cron'],
    name: `Cron`,
    icon: <Clock5 className="absolute inset-0 p-2 text-background w-full h-full" />,
    description: 'cron-based scheduler in Postgres',
    docsUrl: '',
  },
  {
    id: 'vault',
    type: 'postgres_extension' as const,
    requiredExtensions: ['supabase_vault'],
    name: `Vault`,
    icon: <Vault className="absolute inset-0 p-2 text-background w-full h-full" />,
    description: 'Application level encryption for your project',
    docsUrl: '',
  },
  {
    id: 'webhooks',
    type: 'custom' as const,
    name: `Webhooks`,
    icon: <Webhook className="absolute inset-0 p-2 text-background w-full h-full" />,
    description:
      'Send real-time data from your database to another system whenever a table event occurs',
    docsUrl: '',
  },
  {
    id: 'graphiql',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pg_graphql'],
    name: `GraphiQL`,
    icon: <Image fill src={`${BASE_PATH}/img/graphql.svg`} alt="GraphiQL" className="p-2" />,
    description: 'In-browser IDE for GraphQL',
    docsUrl: '',
  },
] as const

const wrapperIntegrations: IntegrationDefinition[] = WRAPPERS.map((w) => {
  return {
    id: w.name,
    type: 'wrapper' as const,
    name: `${w.label} Wrapper`,
    icon: <Image fill src={w.icon} alt={w.name} className="p-2" />,
    description: WRAPPER_HANDLERS[w.label] || 'No description',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/stripe',
    meta: w,
  }
})

export const INTEGRATIONS: IntegrationDefinition[] = [
  ...wrapperIntegrations,
  ...supabaseIntegrations,
]
