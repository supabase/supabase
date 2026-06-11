import { describe, expect, it } from 'vitest'

import { buildAgentPlan } from './agent-plan'
import {
  buildStartComposition,
  getSelectedTemplateIds,
  selectedPrimitives,
} from './composition/start-composition'
import { DEFAULT_CONFIG, type StartConfig } from './config'
import { buildSteps } from './steps'
import { getStartTemplates } from './template-catalog'

const templates = getStartTemplates()

function config(overrides: Partial<StartConfig> = {}): StartConfig {
  return { ...DEFAULT_CONFIG, ...overrides }
}

function composition(cfg: StartConfig) {
  return buildStartComposition(cfg, templates)
}

function stepIds(cfg: StartConfig): string[] {
  return buildSteps(cfg, composition(cfg)).map((s) => s.id)
}

function stepText(step: ReturnType<typeof buildSteps>[number]): string {
  return step.blocks
    .map((block) => {
      if (block.type === 'code') return block.code
      if (block.type === 'note') return block.text
      return ''
    })
    .join('\n')
}

describe('getStartTemplates', () => {
  it('exposes the full embedded template list', () => {
    expect(templates.length).toBeGreaterThan(0)
    expect(templates.map((template) => template.id)).toEqual(
      expect.arrayContaining(['database', 'todos', 'auth', 'storage', 'functions'])
    )
  })

  it('maps selected primitives onto core template IDs', () => {
    expect(getSelectedTemplateIds(config(), templates)).toEqual(
      expect.arrayContaining(['database', 'todos', 'auth'])
    )
  })
})

describe('buildStartComposition', () => {
  it('resolves dependencies and merges selected template files', () => {
    const built = composition(config({ templateIds: ['multi-tenant-rbac'] }))

    expect(built.resolution.resolved.map((template) => template.id)).toEqual(
      expect.arrayContaining(['database', 'auth', 'multi-tenant-rbac'])
    )
    expect(built.mergeResult?.files.length).toBeGreaterThan(0)
  })

  it('selected templates auto-imply the primitives their dependencies require', () => {
    const built = composition(config({ primitives: [], templateIds: ['multi-tenant-rbac'] }))

    expect(
      selectedPrimitives(config({ primitives: [], templateIds: ['multi-tenant-rbac'] }), built)
    ).toEqual(expect.arrayContaining(['auth', 'database']))
  })
})

describe('buildSteps', () => {
  it('produces the expected default order (new + Next.js)', () => {
    const ids = stepIds(config())
    expect(ids).toEqual(['bootstrap', 'plugin', 'cli', 'keys', 'supabase-code', 'connect-app'])
    expect(ids).not.toContain('install')
    expect(ids).not.toContain('client')
  })

  it('adds enabled shadcn blocks in the app connection step', () => {
    const cfg = config()
    const connect = buildSteps(cfg, composition(cfg)).find((s) => s.id === 'connect-app')!

    expect(connect.title).toBe('Connect to your app')
    expect(stepText(connect)).toContain('npx shadcn@latest init -d')
    expect(stepText(connect)).toContain(
      'npx shadcn@latest add @supabase/password-based-auth-nextjs'
    )
  })

  it('adds the dropzone shadcn block when storage is enabled', () => {
    const cfg = config({ primitives: ['database', 'storage'] })
    const connect = buildSteps(cfg, composition(cfg)).find((s) => s.id === 'connect-app')!

    expect(stepText(connect)).toContain('npx shadcn@latest add @supabase/dropzone-nextjs')
  })

  it('guides bucket creation when core Storage is selected without a bucket template', () => {
    const cfg = config({ primitives: ['database', 'storage'], shadcn: false, templateIds: [] })
    const steps = buildSteps(cfg, composition(cfg))
    const supabaseCode = steps.find((s) => s.id === 'supabase-code')!
    const connect = steps.find((s) => s.id === 'connect-app')!

    expect(stepText(supabaseCode)).toContain('does not create an application bucket')
    expect(stepText(connect)).toContain('Add Auth, a Storage bucket')
    expect(stepText(connect)).not.toContain(".from('avatars')")
  })

  it('adds an authenticated bucket recipe when Storage and Auth are selected', () => {
    const cfg = config({
      primitives: ['database', 'auth', 'storage'],
      shadcn: false,
      templateIds: [],
    })
    const steps = buildSteps(cfg, composition(cfg))
    const supabaseCode = steps.find((s) => s.id === 'supabase-code')!
    const connect = steps.find((s) => s.id === 'connect-app')!

    expect(stepText(supabaseCode)).toContain("values ('uploads', 'uploads', false)")
    expect(stepText(supabaseCode)).toContain('Users can upload their own files')
    expect(stepText(connect)).toContain("supabase.storage.from('uploads').upload")
  })

  it('uses the composed bucket name in storage upload snippets', () => {
    const cfg = config({ primitives: ['storage'], shadcn: false, templateIds: ['storage-avatars'] })
    const connect = buildSteps(cfg, composition(cfg)).find((s) => s.id === 'connect-app')!

    expect(stepText(connect)).toContain("supabase.storage.from('avatars').upload")
  })

  it('adds install + client blocks for a non-Next.js new project', () => {
    const cfg = config({ framework: 'vite' })
    const ids = stepIds(cfg)
    const connect = buildSteps(cfg, composition(cfg)).find((s) => s.id === 'connect-app')!

    expect(ids).not.toContain('install')
    expect(ids).not.toContain('client')
    expect(stepText(connect)).toContain('npm install @supabase/supabase-js')
    expect(connect.blocks).toContainEqual(
      expect.objectContaining({ type: 'code', lang: 'src/lib/supabase.ts' })
    )
  })

  it('always includes the CLI step', () => {
    expect(stepIds(config({ connection: 'remote' }))).toContain('cli')
    expect(stepIds(config({ connection: 'local' }))).toContain('cli')
  })

  it('backend-only skips bootstrap, install and client steps', () => {
    const ids = stepIds(config({ framework: 'none', shadcn: false }))
    expect(ids).not.toContain('bootstrap')
    expect(ids).not.toContain('install')
    expect(ids).not.toContain('client')
    expect(ids).toContain('plugin')
    expect(ids).toContain('cli')
  })

  it('existing + shadcn uses the app connection step instead of a separate shadcn-add step', () => {
    const cfg = config({ project: 'existing', shadcn: true })
    const steps = buildSteps(cfg, composition(cfg))
    const connect = steps.find((s) => s.id === 'connect-app')!
    expect(steps.some((s) => s.id === 'add')).toBe(false)
    expect(connect.title).toBe('Connect to your app')
    expect(stepText(connect)).toContain('npx shadcn@latest init -d')
  })

  it('existing + no shadcn uses the Supabase code step instead of a file tree step', () => {
    const cfg = config({ project: 'existing', shadcn: false })
    const steps = buildSteps(cfg, composition(cfg))
    expect(steps.some((s) => s.id === 'add')).toBe(false)
    expect(steps.find((s) => s.id === 'supabase-code')?.title).toBe('Add your Supabase code')
  })

  it('lists config.toml in the Supabase code step', () => {
    const cfg = config()
    const supabaseCode = buildSteps(cfg, composition(cfg)).find((s) => s.id === 'supabase-code')!

    expect(supabaseCode.title).toBe('Add your Supabase code')
    expect(supabaseCode.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'code',
          code: expect.stringContaining('supabase/config.toml'),
        }),
      ])
    )
  })

  it('lists schema files in the Supabase code step without embedding their contents', () => {
    const cfg = config()
    const supabaseCode = buildSteps(cfg, composition(cfg)).find((s) => s.id === 'supabase-code')!
    const text = stepText(supabaseCode)

    expect(supabaseCode.title).toBe('Add your Supabase code')
    expect(supabaseCode.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'code',
          code: expect.stringContaining('supabase/schemas/todos.sql'),
        }),
      ])
    )
    expect(text).not.toContain('create table')
    expect(stepIds(cfg)).not.toContain('composition-files')
  })

  it('includes Data API queries in the app connection step', () => {
    const cfg = config({ primitives: ['database', 'dataapi'] })
    const connect = buildSteps(cfg, composition(cfg)).find((s) => s.id === 'connect-app')!
    const text = stepText(connect)

    expect(connect.title).toBe('Connect to your app')
    expect(text).toContain(".from('todos')")
    expect(text).toContain(".select('*')")
  })

  it('guides table creation when Data API is selected without table resources', () => {
    const cfg = config({ primitives: ['database', 'dataapi'], templateIds: [] })
    const steps = buildSteps(cfg, composition(cfg))
    const supabaseCode = steps.find((s) => s.id === 'supabase-code')!
    const connect = steps.find((s) => s.id === 'connect-app')!
    const text = stepText(connect)

    expect(stepText(supabaseCode)).toContain('does not create tables')
    expect(text).toContain('Create an RLS-protected table')
    expect(text).not.toContain(".from('todos')")
  })

  it('does not scaffold a placeholder function when only Edge Functions is enabled', () => {
    const cfg = config({ primitives: ['functions'], templateIds: [] })
    const functions = buildSteps(cfg, composition(cfg)).find((s) => s.id === 'functions')!

    expect(functions.title).toBe('Enable Edge Functions runtime')
    expect(stepText(functions)).not.toContain('hello')
  })

  it('lists and deploys selected Edge Function templates from the Supabase code step', () => {
    const cfg = config({ primitives: ['functions'], templateIds: ['functions-stripe-webhook'] })
    const supabaseCode = buildSteps(cfg, composition(cfg)).find((s) => s.id === 'supabase-code')!
    const text = stepText(supabaseCode)

    expect(supabaseCode.title).toBe('Add your Supabase code')
    expect(supabaseCode.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'code',
          code: expect.stringContaining('supabase/functions/stripe-webhook/index.ts'),
        }),
        expect.objectContaining({
          type: 'code',
          lang: 'terminal',
          code: expect.stringContaining('npx supabase functions deploy stripe-webhook'),
        }),
      ])
    )
    expect(text).not.toContain('Deno.serve')
    expect(text).not.toContain('functions new hello')
    expect(stepIds(cfg)).not.toContain('functions')
  })

  it('includes top-level selected registry commands in the Supabase code step', () => {
    const cfg = config()
    const supabaseCode = buildSteps(cfg, composition(cfg)).find((s) => s.id === 'supabase-code')!
    const text = stepText(supabaseCode)

    expect(text).toContain('npx shadcn@latest add supabase/supabase/database')
    expect(text).toContain('npx shadcn@latest add supabase/supabase/todos')
    expect(text).toContain('npx shadcn@latest add supabase/supabase/auth')
  })
})

describe('buildAgentPlan', () => {
  it('contains setup step titles and the reference docs section', () => {
    const cfg = config()
    const built = composition(cfg)
    const plan = buildAgentPlan(cfg, built)
    for (const step of buildSteps(cfg, built)) {
      expect(plan).toContain(step.title)
    }
    expect(plan).toContain('## Reference docs')
    expect(plan).toContain('## Stack')
    expect(plan).toContain('## Rules')
  })

  it('lists selected templates in the stack section', () => {
    const cfg = config({ templateIds: ['multi-tenant-rbac'] })
    const plan = buildAgentPlan(cfg, composition(cfg))
    expect(plan).toContain('Multi-tenant RBAC')
  })

  it('includes only top-level shadcn registry install commands', () => {
    const cfg = config({ primitives: [], templateIds: ['multi-tenant-rbac'] })
    const plan = buildAgentPlan(cfg, composition(cfg))

    expect(plan).toContain('Add your Supabase code')
    expect(plan).toContain('Connect to your app')
    expect(plan).not.toContain('## Registry workflow')
    expect(plan).not.toContain('npx shadcn@latest list supabase/supabase')
    expect(plan).not.toContain('npx shadcn@latest view supabase/supabase/multi-tenant-rbac')
    expect(plan).toContain('npx shadcn@latest add supabase/supabase/multi-tenant-rbac')
    expect(plan).not.toContain('npx shadcn@latest add supabase/supabase/auth')
    expect(plan).not.toContain('npx shadcn@latest add supabase/supabase/database')
    expect(plan).toContain('The registry pulls required dependencies automatically')
    expect(plan).toContain('Auth')
    expect(plan).toContain('Database')
  })

  it('always uses the code-first declarative schema rule', () => {
    const cfg = config()
    const plan = buildAgentPlan(cfg, composition(cfg))
    expect(plan).toContain('Manage schema declaratively')
    expect(plan).toContain('supabase/schemas/todos.sql')
    expect(plan).not.toContain('create table "todos"')
    expect(plan).not.toContain('Build all tables, columns and policies in Supabase Studio')
  })

  it('does not ask the agent to scaffold hello when a function template is selected', () => {
    const cfg = config({ primitives: ['functions'], templateIds: ['functions-stripe-webhook'] })
    const plan = buildAgentPlan(cfg, composition(cfg))

    expect(plan).toContain('npx supabase functions deploy stripe-webhook')
    expect(plan).toContain('supabase/functions/stripe-webhook/index.ts')
    expect(plan).not.toContain('Deno.serve')
    expect(plan).not.toContain('supabase functions new hello')
  })

  it('includes dynamic ORM conversion guidance when an ORM is selected', () => {
    const cfg = config({ orm: 'drizzle' })
    const plan = buildAgentPlan(cfg, composition(cfg))

    expect(plan).toContain('Use the installed SQL files as source material for Drizzle')
    expect(plan).toContain('supabase/schemas/todos.sql')
    expect(plan).toContain('src/db/schema.ts')
    expect(plan).toContain('npx drizzle-kit generate')
  })

  it('frames the plan as a backend setup when there is no front-end', () => {
    const cfg = config({ framework: 'none', shadcn: false })
    const plan = buildAgentPlan(cfg, composition(cfg))
    expect(plan).toContain('# Set up my Supabase backend')
    expect(plan).toContain('- Framework: no front-end — backend only')
    expect(plan).not.toContain('- UI:')
  })

  it('adds option-specific storage rules to the agent prompt', () => {
    const cfg = config({ primitives: ['storage'], templateIds: ['storage-avatars'] })
    const plan = buildAgentPlan(cfg, composition(cfg))

    expect(plan).toContain('Use the composed Storage bucket')
    expect(plan).toContain('avatars')
  })
})
