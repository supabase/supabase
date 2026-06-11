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
  it('wraps backend nodes and connects the front-end to the backend wrapper', () => {
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
        expect.objectContaining({
          id: 'backend',
          type: 'backendGroup',
          data: expect.objectContaining({ label: 'Back-end' }),
        }),
        expect.objectContaining({ id: 'database', position: { x: 0, y: 30 } }),
        expect.objectContaining({ id: 'frontend' }),
      ])
    )
    const backend = getFlowNode(flow, 'backend')
    const frontend = getFlowNode(flow, 'frontend')
    expect(frontend.position.y).toBeLessThan(backend.position.y)
    expect(frontend.position.x + 85).toBe(backend.position.x + Number(backend.data.width) / 2)

    expect(flow.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'frontend',
          target: 'backend',
          sourceHandle: 'source-bottom',
          targetHandle: 'target-top',
        }),
      ])
    )
    expect(flow.edges).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ source: 'frontend', target: 'database' })])
    )
  })

  it('sizes the backend wrapper around generated resources', () => {
    const resolution = resolveTemplateDependencies(['storage'], [storageTemplate])
    const mergeResult = mergeTemplates(resolution.resolved)
    const resources = extractCompositionResources({ templates: resolution.resolved, mergeResult })

    const flow = buildCompositionFlow({
      cfg: DEFAULT_CONFIG,
      templates: resolution.resolved,
      resolution,
      mergeResult,
      resources,
      hoveredTemplateId: null,
    })

    const backend = getFlowNode(flow, 'backend')
    const database = getFlowNode(flow, 'database')
    const resource = flow.nodes.find((node) => node.id.startsWith('resource:'))
    expect(resource).toBeDefined()

    const backendRight = backend.position.x + Number(backend.data.width)
    const backendBottom = backend.position.y + Number(backend.data.height)

    expect(backend.position.x).toBeLessThan(database.position.x)
    expect(backend.position.x).toBeLessThan(resource!.position.x)
    expect(backend.position.y).toBeLessThan(database.position.y)
    expect(backendRight).toBeGreaterThan(resource!.position.x + 170)
    expect(backendBottom).toBeGreaterThan(resource!.position.y + 44)
  })

  it('does not add the backend wrapper for backend-only projects', () => {
    const resolution = resolveTemplateDependencies(['storage'], [storageTemplate])
    const mergeResult = mergeTemplates(resolution.resolved)
    const resources = extractCompositionResources({ templates: resolution.resolved, mergeResult })

    const flow = buildCompositionFlow({
      cfg: { ...DEFAULT_CONFIG, framework: 'none' },
      templates: resolution.resolved,
      resolution,
      mergeResult,
      resources,
      hoveredTemplateId: null,
    })

    expect(flow.nodes).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'backend' })])
    )
    expect(flow.nodes).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'frontend' })])
    )
  })
})

function getFlowNode(flow: ReturnType<typeof buildCompositionFlow>, id: string) {
  const node = flow.nodes.find((candidate) => candidate.id === id)
  expect(node).toBeDefined()
  return node!
}
