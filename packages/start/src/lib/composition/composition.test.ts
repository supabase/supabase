import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'

import {
  canRemoveTemplate,
  createCompositionManifest,
  createTemplateZipBlob,
  generateCompositionId,
  mergeTemplates,
  resolveTemplateDependencies,
} from './composition'
import type { Template } from '../template-catalog'

const baseTemplate: Template = {
  id: 'base',
  name: 'Base',
  description: 'Base template',
  category: 'Core',
  version: '1.0.0',
  files: [
    {
      path: 'supabase/config.toml',
      content: `[db]
enabled = true
port = 54322
`,
    },
  ],
}

describe('start composition exports', () => {
  it('generates deterministic composition IDs independent of selection order', () => {
    expect(generateCompositionId(['auth', 'database', 'storage'])).toBe(
      generateCompositionId(['storage', 'auth', 'database'])
    )
  })

  it('resolves required dependencies before selected templates', () => {
    const feature: Template = {
      id: 'feature',
      name: 'Feature',
      description: 'Feature template',
      category: 'Auth',
            version: '1.0.0',
      dependencies: {
        required: ['base'],
      },
      files: [],
    }

    const resolution = resolveTemplateDependencies(['feature'], [baseTemplate, feature])

    expect(resolution.missingDeps).toEqual([])
    expect(resolution.resolved.map((template) => template.id)).toEqual(['base', 'feature'])
  })

  it('prevents removing a template required by another selected template', () => {
    const database: Template = {
      id: 'database',
      name: 'Database',
      description: 'Database template',
      category: 'Core',
            version: '1.0.0',
      files: [],
    }
    const auth: Template = {
      id: 'auth',
      name: 'Auth',
      description: 'Auth template',
      category: 'Auth',
            version: '1.0.0',
      dependencies: {
        required: ['database'],
      },
      files: [],
    }

    expect(canRemoveTemplate('database', ['auth', 'database'], [database, auth])).toBe(false)
    expect(canRemoveTemplate('auth', ['auth', 'database'], [database, auth])).toBe(true)
  })

  it('reports missing dependencies without adding unknown templates', () => {
    const feature: Template = {
      id: 'feature',
      name: 'Feature',
      description: 'Feature template',
      category: 'Auth',
            version: '1.0.0',
      dependencies: {
        required: ['missing-template'],
      },
      files: [],
    }

    const resolution = resolveTemplateDependencies(['feature'], [feature])

    expect(resolution.missingDeps).toEqual(['missing-template'])
    expect(resolution.resolved.map((template) => template.id)).toEqual(['feature'])
  })

  it('deep merges TOML files that target the same path', () => {
    const apiTemplate: Template = {
      id: 'api',
      name: 'API',
      description: 'API template',
      category: 'API',
            version: '1.0.0',
      files: [
        {
          path: 'supabase/config.toml',
          content: `[api]
enabled = true
schemas = ["public", "graphql_public"]
`,
        },
      ],
    }

    const result = mergeTemplates([baseTemplate, apiTemplate])
    const config = result.files.find((file) => file.path === 'supabase/config.toml')

    expect(config?.sources).toEqual(['base', 'api'])
    expect(config?.content).toContain('[db]')
    expect(config?.content).toContain('enabled = true')
    expect(config?.content).toContain('[api]')
    expect(config?.content).toMatch(/schemas\s*=\s*\[\s*"public"\s*,\s*"graphql_public"\s*\]/)
  })

  it('deduplicates repeated SQL objects and emits warnings for unsafe duplicates', () => {
    const first: Template = {
      id: 'first',
      name: 'First',
      description: 'First SQL template',
      category: 'Database',
            version: '1.0.0',
      files: [
        {
          path: 'supabase/schemas/app.sql',
          content: `create table public.todos (
  id bigint primary key
);
`,
        },
      ],
    }
    const second: Template = {
      id: 'second',
      name: 'Second',
      description: 'Second SQL template',
      category: 'Database',
            version: '1.0.0',
      files: [
        {
          path: 'supabase/schemas/app.sql',
          content: `create table public.todos (
  id bigint primary key
);
`,
        },
      ],
    }

    const result = mergeTemplates([first, second])
    const sqlFile = result.files.find((file) => file.path === 'supabase/schemas/app.sql')

    expect(sqlFile?.content.match(/create table public\.todos/g)).toHaveLength(1)
    expect(result.warnings).toContain('Duplicate table "public.todos" from second')
  })

  it('packages a single template into a zip archive', async () => {
    const blob = await createTemplateZipBlob(baseTemplate)
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    const config = await zip.file('supabase/config.toml')?.async('string')

    expect(config).toContain('[db]')
    expect(zip.file('composition.json')).toBeNull()
  })

  it('creates a stable manifest shape for exports', () => {
    const result = mergeTemplates([baseTemplate])
    const manifest = createCompositionManifest(result, '2026-01-01T00:00:00.000Z')

    expect(manifest).toEqual({
      compositionId: result.compositionId,
      generatedAt: '2026-01-01T00:00:00.000Z',
      templates: ['base'],
      files: [
        {
          path: 'supabase/config.toml',
          sources: ['base'],
        },
      ],
      warnings: [],
    })
  })
})
