import { WRAPPERS } from 'components/interfaces/Database/Wrappers/Wrappers.constants'
import { WrapperMeta } from 'components/interfaces/Database/Wrappers/Wrappers.types'

export type IntegrationDefinition = {
  id: string
  name: string
  icon: string
  description: string
  docsUrl: string
  meta: WrapperMeta
} & ({ type: 'wrapper'; meta: WrapperMeta } | { type: 'postgres_extension' })

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

export const INTEGRATIONS: IntegrationDefinition[] = WRAPPERS.map((w) => {
  return {
    id: w.name,
    type: 'wrapper',
    name: `${w.label} Wrapper`,
    icon: w.icon,
    description: WRAPPER_HANDLERS[w.label] || 'No description',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/stripe',
    meta: w,
  }
})
