import { fileURLToPath } from 'node:url'
import { projectComposerTemplateIndex, projectComposerTemplates } from '..'
import { describe, expect, it } from 'vitest'

import { bundleTemplateRepository } from './bundle'
import { parseTemplateMetadata, parseTemplateRegistry } from './schema'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))

describe('project composer template package', () => {
  it('bundles the registry-driven template folders into the runtime template shape', async () => {
    await expect(bundleTemplateRepository({ rootDir: packageRoot })).resolves.toEqual(
      projectComposerTemplates
    )
  })

  it('exports a repository index that can be served as JSON', () => {
    expect(projectComposerTemplateIndex).toEqual({ templates: projectComposerTemplates })
  })

  it('keeps generated file paths relative to the exported project root', () => {
    const stripeTemplate = projectComposerTemplates.find(
      (template) => template.id === 'functions-stripe-webhook'
    )

    expect(stripeTemplate?.files.map((file) => file.path)).toEqual([
      'supabase/functions/stripe-webhook/index.ts',
      'supabase/schemas/billing.sql',
    ])
  })

  it('rejects duplicate registry entries', () => {
    expect(() =>
      parseTemplateRegistry({ templates: ['auth', 'auth'] })
    ).toThrow('Project composer template registry contains duplicate "auth"')
  })

  it('rejects invalid template metadata before bundling', () => {
    expect(() => parseTemplateMetadata({ id: 'missing-fields' })).toThrow(
      'Project composer template field "name" must be a non-empty string'
    )
  })
})
