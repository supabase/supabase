import { describe, expect, it } from 'vitest'

import { mergeTemplates, resolveTemplateDependencies } from '../../lib/composition/composition'
import { extractCompositionResources } from '../../lib/composition/resources'
import { DEFAULT_CONFIG } from '../../lib/config'
import type { Template } from '../../lib/template-catalog'
import { buildCompositionFlow, buildGraphLayoutKey } from './CompositionVisualizer'

const storageTemplate: Template = {
  id: 'storage',
  name: 'Storage',
  description: 'Storage template',
  category: 'Storage',
  version: '1.0.0',
  files: [
    {
      path: 'supabase/schemas/storage.sql',
      content: 'create table if not exists public.files (id text primary key);\n',
    },
  ],
}

describe('buildGraphLayoutKey', () => {
  it('changes when resolved templates change', () => {
    const resolution = resolveTemplateDependencies([], [])
    const mergeResult = null
    const resources = extractCompositionResources({ templates: [], mergeResult })

    const emptyKey = buildGraphLayoutKey({ resolution, mergeResult, resources })

    const withStorage = resolveTemplateDependencies(['storage'], [storageTemplate])
    const withStorageMerge = mergeTemplates(withStorage.resolved)
    const withStorageResources = extractCompositionResources({
      templates: withStorage.resolved,
      mergeResult: withStorageMerge,
    })

    const populatedKey = buildGraphLayoutKey({
      resolution: withStorage,
      mergeResult: withStorageMerge,
      resources: withStorageResources,
    })

    expect(populatedKey).not.toBe(emptyKey)
  })

  it('is stable for hover-only visual changes', () => {
    const resolution = resolveTemplateDependencies(['storage'], [storageTemplate])
    const mergeResult = mergeTemplates(resolution.resolved)
    const resources = extractCompositionResources({ templates: resolution.resolved, mergeResult })

    const first = buildGraphLayoutKey({ resolution, mergeResult, resources })
    const second = buildGraphLayoutKey({ resolution, mergeResult, resources })

    expect(first).toBe(second)
  })

  it('changes when the framework node changes', () => {
    const resolution = resolveTemplateDependencies([], [])
    const mergeResult = null
    const resources = extractCompositionResources({ templates: [], mergeResult })

    expect(
      buildGraphLayoutKey({ frameworkId: 'nextjs', resolution, mergeResult, resources })
    ).not.toBe(buildGraphLayoutKey({ frameworkId: 'none', resolution, mergeResult, resources }))
  })
})

describe('buildCompositionFlow', () => {
  it('keeps the composer backend layout and connects the front-end to the database', () => {
    const resolution = resolveTemplateDependencies([], [])
    const mergeResult = null
    const resources = extractCompositionResources({ templates: [], mergeResult })

    const flow = buildCompositionFlow({
      cfg: DEFAULT_CONFIG,
      templates: [],
      resolution,
      mergeResult,
      resources,
      hoveredTemplateId: null,
    })

    expect(flow.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'database', position: { x: 0, y: 30 } }),
        expect.objectContaining({ id: 'frontend' }),
      ])
    )
    expect(flow.edges).toEqual(
      expect.arrayContaining([expect.objectContaining({ source: 'frontend', target: 'database' })])
    )
  })
})
