import { fileURLToPath } from 'node:url'
import { templateIndex, templates } from '..'
import { describe, expect, it } from 'vitest'

import { bundleTemplateRepository } from './bundle'
import { parseTemplateRegistry, parseTemplateSummary } from './schema'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))

describe('templates package bundle', () => {
  it('bundles the shadcn registry into the runtime template shape', async () => {
    const result = await bundleTemplateRepository({ rootDir: packageRoot })
    expect(result.templates).toEqual(templates)
  })

  it('exports a repository index that can be served as JSON', () => {
    expect(templateIndex).toEqual({ templates })
  })

  it('bundles optional readme.md files from template folders', () => {
    const agentTemplate = templates.find((template) => template.id === 'agent')

    expect(agentTemplate?.readme).toContain('persistent AI agents')
  })

  it('keeps generated file paths relative to the exported project root', () => {
    const stripeTemplate = templates.find((template) => template.id === 'functions-stripe-webhook')

    expect(stripeTemplate?.files.map((file) => file.path)).toEqual([
      'supabase/functions/stripe-webhook/index.ts',
      'supabase/schemas/billing.sql',
    ])
  })

  it('rejects duplicate legacy registry entries', () => {
    expect(() => parseTemplateRegistry({ templates: ['auth', 'auth'] })).toThrow(
      'Template registry contains duplicate "auth"'
    )
  })

  it('rejects invalid template metadata before bundling', () => {
    expect(() => parseTemplateSummary({ id: 'missing-fields' })).toThrow(
      'Template field "name" must be a non-empty string'
    )
  })

  it('requires a version on template metadata', () => {
    expect(() =>
      parseTemplateSummary({
        id: 'no-version',
        name: 'No Version',
        description: 'x',
        category: 'Core',
      })
    ).toThrow('Template field "version" must be a non-empty string')
  })
})
