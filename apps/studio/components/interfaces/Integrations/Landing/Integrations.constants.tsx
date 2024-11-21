import { Clock5, Layers, Vault, Webhook } from 'lucide-react'
import Image from 'next/image'
import { ReactNode } from 'react'

import { WRAPPERS } from 'components/interfaces/Database/Wrappers/Wrappers.constants'
import { WrapperMeta } from 'components/interfaces/Database/Wrappers/Wrappers.types'
import { BASE_PATH } from 'lib/constants'
import { cn } from 'ui'

type Navigation = {
  route: string
  label: string
  hasChild?: boolean
  childIcon?: React.ReactNode
  children?: Navigation[]
}

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
  navigation?: Navigation[]
} & (
  | { type: 'wrapper'; meta: WrapperMeta }
  | { type: 'postgres_extension'; requiredExtensions: string[] }
  | { type: 'custom' }
)

const authorSupabase = {
  name: 'Supabase',
  websiteUrl: 'https://supabase.com',
}

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
    navigation: [
      {
        route: '/queues',
        label: 'Overview',
      },
      {
        route: '/queues/queues',
        label: 'Queues',
        hasChild: true,
        childIcon: (
          <Layers size={12} strokeWidth={1.5} className={cn('text-foreground w-full h-full')} />
        ),
      },
    ],
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
    navigation: [
      {
        route: '/cron-jobs',
        label: 'Overview',
      },
      {
        route: '/cron-jobs/cron-jobs',
        label: 'Cron Jobs',
      },
    ],
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
    navigation: [
      {
        route: '/vault',
        label: 'Overview',
      },
      {
        route: '/vault/keys',
        label: 'Keys',
      },
      {
        route: '/vault/secrets',
        label: 'Secrets',
      },
    ],
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
    navigation: [
      {
        route: '/webhooks',
        label: 'Overview',
      },
      {
        route: '/webhooks/webhooks',
        label: 'Webhooks',
      },
    ],
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
    navigation: [
      {
        route: '/graphiql',
        label: 'Overview',
      },
      {
        route: '/graphiql/graphiql',
        label: 'GraphiQL',
      },
    ],
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
    description: w.description,
    docsUrl: w.docsUrl,
    meta: w,
    author: authorSupabase,
    navigation: [
      {
        route: `/${w.name}`,
        label: 'Overview',
      },
      {
        route: `/${w.name}/wrappers`,
        label: 'Wrappers',
      },
    ],
  }
})

export const INTEGRATIONS: IntegrationDefinition[] = [
  ...wrapperIntegrations,
  ...supabaseIntegrations,
]
