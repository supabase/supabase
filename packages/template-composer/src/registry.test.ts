import { describe, expect, it } from 'vitest'

import { resolveRegistryManifest } from './registry/resolve'
import {
  normalizeRegistrySlug,
  parseRegistryDependencyRef,
  parseRegistryItem,
  parseRegistryManifest,
  toRegistryDependencyRef,
} from './registry/schema'

describe('shadcn registry format', () => {
  it('parses the root registry manifest with includes', async () => {
    const manifest = parseRegistryManifest({
      name: 'supabase-templates',
      include: ['templates/database/registry.json'],
    })

    expect(manifest.name).toBe('supabase-templates')
    expect(manifest.include).toEqual(['templates/database/registry.json'])
  })

  it('resolves included registry items', async () => {
    const files: Record<string, unknown> = {
      '/registry.json': {
        include: ['templates/database/registry.json'],
      },
      '/templates/database/registry.json': {
        name: 'database',
        type: 'registry:item',
        files: [{ path: 'supabase/config.toml', type: 'registry:file' }],
      },
    }
    const { items } = await resolveRegistryManifest('/registry.json', async (filePath) => {
      const file = files[filePath]
      if (!file) throw new Error(`Missing fixture: ${filePath}`)
      return file
    })

    expect(items.map((item) => item.name)).toEqual(['database'])
  })

  it('maps same-repository registry dependency refs to template ids', () => {
    expect(toRegistryDependencyRef('auth')).toBe('SaxonF/templates/auth')
    expect(toRegistryDependencyRef('auth', 'https://github.com/supabase/templates')).toBe(
      'supabase/templates/auth'
    )
    expect(parseRegistryDependencyRef('SaxonF/templates/auth')).toBe('auth')
    expect(parseRegistryDependencyRef('SaxonF/templates/auth#v1.0.0')).toBe('auth')
    expect(
      parseRegistryDependencyRef(
        'supabase/templates/auth#main',
        'https://github.com/supabase/templates'
      )
    ).toBe('auth')
    expect(parseRegistryDependencyRef('auth')).toBe('auth')
  })

  it('normalizes GitHub repository URLs for registry addresses', () => {
    expect(normalizeRegistrySlug('SaxonF/templates')).toBe('SaxonF/templates')
    expect(normalizeRegistrySlug('https://github.com/supabase/templates/')).toBe(
      'supabase/templates'
    )
  })

  it('rejects duplicate registry items', async () => {
    await expect(
      resolveRegistryManifest('/registry.json', async () => ({
        include: [],
        items: [
          parseRegistryItem({ name: 'auth', type: 'registry:item' }),
          parseRegistryItem({ name: 'auth', type: 'registry:item' }),
        ],
      }))
    ).rejects.toThrow('duplicate item "auth"')
  })
})
