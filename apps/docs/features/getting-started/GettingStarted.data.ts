import { isFeatureEnabled } from 'common/enabled-features'
import { setupCommand } from '~/components/HomePageCover.constants'
import { type IsoShapeName } from 'ui-patterns/IsoShape/IsoShape.shapes'

import { FRAMEWORKS, getFramework } from './GettingStarted.frameworks'

export interface ExploreItem {
  id: string
  name: string
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
    name: 'Auth',
    description: 'Add email, passwordless, OAuth, and phone sign-in.',
    href: '/guides/auth',
    shape: 'Auth',
  },
  {
    id: 'mcp',
    name: 'MCP server',
    description:
      'Connect your AI tools to your Supabase project through the Model Context Protocol.',
    href: '/guides/ai-tools/mcp',
    shape: 'Platform',
    shapeClassName: 'origin-left scale-90',
  },
  {
    id: 'storage',
    name: 'Storage',
    description: 'Store and serve files with access policies.',
    href: '/guides/storage/quickstart',
    shape: 'Storage',
  },
  {
    id: 'realtime',
    name: 'Realtime',
    description: 'Listen to database changes, broadcast messages, and track presence.',
    href: '/guides/realtime',
    shape: 'Realtime',
  },
  {
    id: 'functions',
    name: 'Edge Functions',
    description: 'Run server-side TypeScript close to your users.',
    href: '/guides/functions/quickstart',
    shape: 'Edge Functions',
  },
]

export const DEFAULT_CHOICES: Choices = {
  start: 'agent',
  fw: null,
  features: [],
}

export const parseChoices = (params: { get: (key: string) => string | null }): Choices => ({
  start:
    START_OPTIONS.find((option) => option.id === params.get('start'))?.id ?? DEFAULT_CHOICES.start,
  fw: FRAMEWORKS.find((framework) => framework.slug === params.get('fw'))?.slug ?? null,
  features: EXPLORE_ITEMS.filter((item) =>
    (params.get('features') ?? '').split(',').includes(item.id)
  ).map((item) => item.id),
})

export const LOCAL_COMMANDS = [
  setupCommand.installCli,
  setupCommand.initialize,
  'npx supabase start',
].join('\n')

// user management tutorials, keyed by quickstart slug. each builds a full app on the same framework
const TUTORIALS: Record<string, { page: string; isMobile?: boolean }> = {
  nextjs: { page: 'with-nextjs' },
  reactjs: { page: 'with-react' },
  vue: { page: 'with-vue-3' },
  nuxtjs: { page: 'with-nuxt-3' },
  redwoodjs: { page: 'with-redwoodjs' },
  sveltekit: { page: 'with-sveltekit' },
  solidjs: { page: 'with-solidjs' },
  refine: { page: 'with-refine' },
  'expo-react-native': { page: 'with-expo-react-native', isMobile: true },
  flutter: { page: 'with-flutter', isMobile: true },
  'ios-swiftui': { page: 'with-swift', isMobile: true },
  kotlin: { page: 'with-kotlin', isMobile: true },
}

export const getTutorialStep = (fw: string | null): NextStep | undefined => {
  const framework = getFramework(fw)
  if (!framework) return
  const tutorial = TUTORIALS[framework.slug]
  if (!tutorial) return
  if (!isFeatureEnabled(tutorial.isMobile ? 'docs:mobile_tutorials' : 'docs:web_apps')) return
  return {
    id: 'tutorial',
    title: `Build a full app with ${framework.name}`,
    description: 'Follow a full tutorial with sign-up, profiles, and avatar uploads.',
    href: `/guides/getting-started/tutorials/${tutorial.page}`,
  }
}

export const NEXT_STEPS: NextStep[] = [
  {
    id: 'ai-tools',
    title: 'Build with AI tools',
    description: 'Use the Supabase plugin, MCP server, and agent skills.',
    href: '/guides/ai-tools',
  },
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

export const getNextSteps = (fw: string | null): NextStep[] => {
  const tutorial = getTutorialStep(fw)
  return [...(tutorial ? [tutorial] : []), ...NEXT_STEPS]
}
