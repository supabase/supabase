import { describe, expect, it } from 'vitest'

import { mergeTemplates, resolveTemplateDependencies } from '../lib/composer'
import { extractComposerResources } from '../lib/resources'
import type { Template } from '../lib/templates'
import { buildGraphLayoutKey } from './ComposerFlow'

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
    const resources = extractComposerResources({ templates: [], mergeResult })

    const emptyKey = buildGraphLayoutKey({ resolution, mergeResult, resources })

    const withStorage = resolveTemplateDependencies(['storage'], [storageTemplate])
    const withStorageMerge = mergeTemplates(withStorage.resolved)
    const withStorageResources = extractComposerResources({
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

  it('is stable for hover-only visual changes (same structure)', () => {
    const resolution = resolveTemplateDependencies(['storage'], [storageTemplate])
    const mergeResult = mergeTemplates(resolution.resolved)
    const resources = extractComposerResources({ templates: resolution.resolved, mergeResult })

    const first = buildGraphLayoutKey({ resolution, mergeResult, resources })
    const second = buildGraphLayoutKey({ resolution, mergeResult, resources })

    expect(first).toBe(second)
  })
})
