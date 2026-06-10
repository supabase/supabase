import { describe, expect, it } from 'vitest'

import { buildAgentPlan } from './agent-plan'
import { DEFAULT_CONFIG, type StartConfig } from './config'
import { getStartFeatures, selectedPrims } from './features'
import { buildSteps } from './steps'

const features = getStartFeatures()

function config(overrides: Partial<StartConfig> = {}): StartConfig {
  return { ...DEFAULT_CONFIG, ...overrides }
}

function stepIds(cfg: StartConfig): string[] {
  return buildSteps(cfg, features).map((s) => s.id)
}

describe('getStartFeatures', () => {
  it('excludes the core primitive templates', () => {
    const ids = features.map((f) => f.id)
    for (const core of ['database', 'functions', 'storage', 'auth', 'api', 'graphql']) {
      expect(ids).not.toContain(core)
    }
  })

  it('exposes a non-empty feature list from the templates package', () => {
    expect(features.length).toBeGreaterThan(0)
  })

  it('maps template dependencies onto rail primitives', () => {
    const rbac = features.find((f) => f.id === 'multi-tenant-rbac')
    expect(rbac).toBeDefined()
    expect(rbac!.neededPrimitives).toEqual(expect.arrayContaining(['auth', 'database']))
  })
})

describe('buildSteps', () => {
  it('produces the expected default order (new + Next.js)', () => {
    const ids = stepIds(config())
    // New Next.js project (shadcn on) skips the install + client steps —
    // the with-supabase starter ships them.
    expect(ids).toEqual(['bootstrap', 'plugin', 'cli', 'keys', 'shadcn', 'database', 'auth'])
    expect(ids).not.toContain('install')
    expect(ids).not.toContain('client')
  })

  it('adds install + client steps for a non-Next.js new project', () => {
    const ids = stepIds(config({ framework: 'vite' }))
    expect(ids).toContain('install')
    expect(ids).toContain('client')
  })

  it('always includes the CLI step (code-first)', () => {
    expect(stepIds(config({ connection: 'remote' }))).toContain('cli')
    expect(stepIds(config({ connection: 'local' }))).toContain('cli')
  })

  it('the database step is always the declarative-schema flow', () => {
    const steps = buildSteps(config(), features)
    const db = steps.find((s) => s.id === 'database')!
    const text = JSON.stringify(db)
    expect(text).toContain('db diff')
    expect(db.title).toBe('Declare your schema')
  })

  it('backend-only skips bootstrap, install and client steps', () => {
    const ids = stepIds(config({ framework: 'none' }))
    expect(ids).not.toContain('bootstrap')
    expect(ids).not.toContain('install')
    expect(ids).not.toContain('client')
    expect(ids).toContain('plugin')
    expect(ids).toContain('cli')
  })

  it('existing + shadcn yields the shadcn-add step, not a file tree', () => {
    const steps = buildSteps(config({ project: 'existing', shadcn: true }), features)
    const add = steps.find((s) => s.id === 'add')!
    expect(add.title).toBe('Add Supabase UI blocks')
    expect(add.blocks.some((b) => b.type === 'filetree')).toBe(false)
  })

  it('existing + no shadcn yields a file tree step', () => {
    const steps = buildSteps(config({ project: 'existing', shadcn: false }), features)
    const add = steps.find((s) => s.id === 'add')!
    expect(add.blocks.some((b) => b.type === 'filetree')).toBe(true)
  })

  it('selecting a feature auto-implies its primitives and appends a feature step', () => {
    const cfg = config({ features: ['multi-tenant-rbac'] })
    expect(selectedPrims(cfg, features)).toEqual(expect.arrayContaining(['auth', 'database']))
    const steps = buildSteps(cfg, features)
    const featureStep = steps.find((s) => s.id === 'f-multi-tenant-rbac')
    expect(featureStep).toBeDefined()
    expect(featureStep!.feature).toBe(true)
    expect(featureStep!.blocks.length).toBeGreaterThan(0)
  })
})

describe('buildAgentPlan', () => {
  it('contains every step title and the reference docs section', () => {
    const cfg = config()
    const plan = buildAgentPlan(cfg, features)
    for (const step of buildSteps(cfg, features)) {
      expect(plan).toContain(step.title)
    }
    expect(plan).toContain('## Reference docs')
    expect(plan).toContain('## Stack')
    expect(plan).toContain('## Rules')
  })

  it('lists selected features in the stack section', () => {
    const plan = buildAgentPlan(config({ features: ['multi-tenant-rbac'] }), features)
    const rbacName = features.find((f) => f.id === 'multi-tenant-rbac')!.name
    expect(plan).toContain(`- Features: ${rbacName}`)
  })

  it('always uses the code-first declarative schema rule', () => {
    const plan = buildAgentPlan(config(), features)
    expect(plan).toContain('Manage schema declaratively')
    expect(plan).not.toContain('Build all tables, columns and policies in Supabase Studio')
  })

  it('frames the plan as a backend setup when there is no front-end', () => {
    const plan = buildAgentPlan(config({ framework: 'none', shadcn: false }), features)
    expect(plan).toContain('# Set up my Supabase backend')
    expect(plan).toContain('- Framework: no front-end — backend only')
    expect(plan).not.toContain('- UI:')
  })
})
