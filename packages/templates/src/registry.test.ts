import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { bundleTemplateRepository } from './bundle'
import { resolveRegistryManifest } from './registry/resolve'
import {
  parseRegistryDependencyRef,
  parseRegistryItem,
  parseRegistryManifest,
  toRegistryDependencyRef,
} from './registry/schema'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))

describe('shadcn registry format', () => {
  it('parses the root registry manifest with includes', async () => {
    const manifest = parseRegistryManifest(
      JSON.parse(await readFile(`${packageRoot}/registry.json`, 'utf8'))
    )

    expect(manifest.name).toBe('supabase-templates')
    expect(manifest.include?.length).toBeGreaterThan(0)
  })

  it('resolves included registry items for every template folder', async () => {
    const { items } = await resolveRegistryManifest(`${packageRoot}/registry.json`)

    expect(items.length).toBeGreaterThan(20)
    expect(items.some((item) => item.name === 'database')).toBe(true)
  })

  it('maps registry dependency refs to template ids', () => {
    expect(toRegistryDependencyRef('auth')).toBe('supabase/supabase/auth')
    expect(parseRegistryDependencyRef('supabase/supabase/auth')).toBe('auth')
    expect(parseRegistryDependencyRef('auth')).toBe('auth')
  })

  it('bundles registry items into the runtime template shape', async () => {
    const { templates } = await bundleTemplateRepository({ rootDir: packageRoot })
    const auth = templates.find((template) => template.id === 'auth')

    expect(auth?.files.some((file) => file.path.endsWith('config.toml'))).toBe(true)
    expect(auth?.dependencies?.required).toContain('database')
  })

  it('rejects duplicate registry items', async () => {
    await expect(
      resolveRegistryManifest(`${packageRoot}/registry.json`, async () => ({
        include: [],
        items: [
          parseRegistryItem({ name: 'auth', type: 'registry:item' }),
          parseRegistryItem({ name: 'auth', type: 'registry:item' }),
        ],
      }))
    ).rejects.toThrow('duplicate item "auth"')
  })
})
