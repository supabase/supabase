import type { StartConfig } from './config'

export type ConfigRailStepId =
  | 'intro'
  | 'code'
  | 'project'
  | 'framework'
  | 'component-library'
  | 'primitives'
  | 'data-layer'
  | 'connection'
  | 'agent'
  | 'features'
  | 'ready'

export interface ConfigRailStepMeta {
  id: ConfigRailStepId
  title: string
  description: string
}

const STEP_META: Record<ConfigRailStepId, Omit<ConfigRailStepMeta, 'id'>> = {
  intro: {
    title: 'This is your Supabase backend',
    description:
      'A set of Postgres-first primitives that can be combined into the backend you need — database, auth, storage, edge functions, and more. Pick what fits and skip the rest. Connect however you want: any framework, any ORM, local or hosted.',
  },
  code: {
    title: 'See your backend as code',
    description:
      'Every part of your Supabase back-end has a code counterpart — SQL schemas, edge functions, config, and more. Your agent can read, act on, and deploy these files directly.',
  },
  project: {
    title: 'Choose a project type',
    description: 'Are you starting fresh or adding Supabase to something you already have?',
  },
  framework: {
    title: 'Choose a framework',
    description: 'Choose the front-end you want to connect — or skip it for a backend-only setup.',
  },
  'component-library': {
    title: 'Choose a component library',
    description:
      'Add prebuilt Supabase UI blocks for your framework, or bring your own components.',
  },
  primitives: {
    title: 'Choose backend pieces',
    description:
      'Select the Supabase primitives your project needs. You can always add more later.',
  },
  'data-layer': {
    title: 'Choose a data layer',
    description: 'How you want to query and model data — the Supabase client, Drizzle, or Prisma.',
  },
  connection: {
    title: 'Choose where it runs',
    description: 'Develop against a hosted Supabase project or run everything locally with Docker.',
  },
  agent: {
    title: 'Choose an agent',
    description: 'Pick the coding agent plugin that will help you scaffold and iterate.',
  },
  features: {
    title: 'Choose features',
    description:
      'Optional starter patterns layered on your primitives — pick any that fit your app.',
  },
  ready: {
    title: 'Review your plan',
    description:
      'Copy a plan for your agent, download the code, or follow the setup guide — then start building.',
  },
}

export function getConfigRailSteps(cfg: StartConfig): ConfigRailStepMeta[] {
  const ids: ConfigRailStepId[] = ['intro', 'code', 'project', 'framework']

  if (cfg.framework !== 'none') {
    ids.push('component-library')
  }

  ids.push('primitives', 'data-layer', 'connection', 'agent', 'features', 'ready')

  return ids.map((id) => ({ id, ...STEP_META[id] }))
}
