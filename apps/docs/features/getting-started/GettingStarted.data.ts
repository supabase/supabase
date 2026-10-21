import { setupCommand } from '~/components/HomePageCover.constants'
import { type IsoShapeName } from 'ui-patterns/IsoShape/IsoShape.shapes'

import { FRAMEWORKS } from './GettingStarted.frameworks'

export interface ExploreItem {
  id: string
  name: string
  feature: string
  description: string
  href: string
  shape: IsoShapeName
  shapeClassName?: string
}

interface Choices {
  start: Start
  fw: string | null
  features: string[]
}

interface NextStep {
  id: string
  title: string
  description: string
  href: string
}

type Start = (typeof START_OPTIONS)[number]['id']

export const START_OPTIONS = [
  { id: 'agent', label: 'Agent', description: 'Your AI agent sets up Supabase for you.' },
  { id: 'cli', label: 'CLI', description: 'Run Supabase on your machine.' },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Create a hosted project in the cloud.',
  },
] as const

export const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: 'auth',
    name: 'Add users',
    feature: 'Auth',
    description: 'Sign users in with email, passwordless links, OAuth, or phone.',
    href: '/guides/auth',
    shape: 'Auth',
  },
  {
    id: 'ai-tools',
    name: 'Connect your AI agent',
    feature: 'AI tools',
    description: 'Install the Supabase plugin, which bundles the MCP server and agent skills.',
    href: '/guides/ai-tools',
    shape: 'Platform',
    shapeClassName: 'origin-left scale-90',
  },
  {
    id: 'storage',
    name: 'Handle files and uploads',
    feature: 'Storage',
    description: 'Store and serve files with access policies.',
    href: '/guides/storage/quickstart',
    shape: 'Storage',
  },
  {
    id: 'realtime',
    name: 'Reflect changes live',
    feature: 'Realtime',
    description: 'Listen to database changes, broadcast messages, and track presence.',
    href: '/guides/realtime',
    shape: 'Realtime',
  },
  {
    id: 'functions',
    name: 'Add server-side logic',
    feature: 'Edge Functions',
    description: 'Run TypeScript close to your users, for webhooks, emails, and AI calls.',
    href: '/guides/functions/quickstart',
    shape: 'Edge Functions',
  },
]

export const parseChoices = (params: { get: (key: string) => string | null }): Choices => ({
  start: START_OPTIONS.find((option) => option.id === params.get('start'))?.id ?? 'agent',
  fw: FRAMEWORKS.find((framework) => framework.slug === params.get('fw'))?.slug ?? null,
  features: EXPLORE_ITEMS.filter((item) =>
    (params.get('features') ?? '').split(',').includes(item.id)
  ).map((item) => item.id),
})

export const CREATE_PROJECT_URL = 'https://supabase.com/dashboard/new'

export const LOCAL_COMMANDS = [
  setupCommand.installCli,
  setupCommand.initialize,
  setupCommand.start,
].join('\n')

export const NEXT_STEPS: NextStep[] = [
  {
    id: 'row-level-security',
    title: 'Secure your data',
    description: 'Control who can read and write each row with Row Level Security.',
    href: '/guides/database/postgres/row-level-security',
  },
  {
    id: 'production',
    title: 'Go to production',
    description: 'Check security, performance, and availability before you launch.',
    href: '/guides/deployment/going-into-prod',
  },
]
