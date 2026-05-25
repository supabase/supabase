import { describe, expect, it } from 'vitest'

import { mergeTemplates, resolveTemplateDependencies } from './composer'
import { buildComposerGraph } from './graph'
import type { Template } from './templates'

const databaseTemplate: Template = {
  id: 'database',
  name: 'Database',
  description: 'Database template',
  category: 'Core',
    version: '1.0.0',
  files: [{ path: 'supabase/config.toml', content: '[db]\nenabled = true\n' }],
}

const authTemplate: Template = {
  id: 'auth-email',
  name: 'Email Auth',
  description: 'Email auth template',
  category: 'Auth',
    version: '1.0.0',
  dependencies: {
    required: ['database'],
  },
  files: [{ path: 'supabase/schemas/auth.sql', content: 'create table public.profiles();\n' }],
}

describe('project composer graph adapter', () => {
  it('converts templates, dependencies, and output resources into graph primitives', () => {
    const templates = [databaseTemplate, authTemplate]
    const selectedIds = new Set(['auth-email'])
    const resolution = resolveTemplateDependencies(Array.from(selectedIds), templates)
    const mergeResult = mergeTemplates(resolution.resolved)
    const graph = buildComposerGraph({ templates, selectedIds, resolution, mergeResult })

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'template:database', kind: 'template' }),
        expect.objectContaining({ id: 'template:auth-email', kind: 'template' }),
        expect.objectContaining({ id: 'resource:config:db', kind: 'resource' }),
        expect.objectContaining({ id: 'resource:table:public.profiles', kind: 'resource' }),
      ])
    )
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'dependency:database->auth-email',
          kind: 'dependency',
        }),
        expect.objectContaining({
          id: 'output:auth-email->table:public.profiles',
          kind: 'output',
        }),
      ])
    )
  })
})
