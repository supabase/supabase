import Image from 'next/image'

import { WRAPPERS } from 'components/interfaces/Database/Wrappers/Wrappers.constants'
import { WrapperMeta } from 'components/interfaces/Database/Wrappers/Wrappers.types'
import { Layers } from 'lucide-react'
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
    id: 'supabase-queues',
    type: 'postgres_extension' as const,
    requiredExtensions: ['pgmq'],
    name: `Queues`,
    icon: <Layers className="absolute inset-0 p-2 text-background w-full h-full" />,
    description: 'No description',
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
