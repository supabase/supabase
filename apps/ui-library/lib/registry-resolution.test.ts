import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { registrySchema, type RegistryItem } from 'shadcn/schema'
import { describe, expect, it } from 'vitest'

import { registry } from '../registry'
import { registryItemAppend } from '../registry/utils'
import { generateRegistryTree, type RegistryNode } from './process-registry'
import {
  getInstalledPath,
  normalizeVueRegistryFiles,
  resolveRegistryItem,
} from './registry-resolution'

function item(name: string, overrides: Partial<RegistryItem> = {}): RegistryItem {
  return {
    name,
    type: 'registry:block',
    files: [
      { path: `lib/${name}.ts`, type: 'registry:lib', content: `export const ${name} = true` },
    ],
    ...overrides,
  }
}

function treePaths(nodes: RegistryNode[]): string[] {
  return nodes.flatMap((node) =>
    node.type === 'file' ? [node.path.slice(1)] : treePaths(node.children ?? [])
  )
}

describe('registry composition and resolution', () => {
  it('preserves block and appended client instructions without undefined dependencies', () => {
    const composed = registryItemAppend(item('block', { docs: 'Configure the block.' }), [
      item('client', { docs: 'Set the client environment variables.' }),
      item('utility'),
    ])
    expect(composed.docs).toBe('Configure the block.\n\nSet the client environment variables.')
    expect(composed.dependencies).toEqual([])
    expect(composed.registryDependencies).toEqual([])
  })

  it('resolves local dependency diamonds once and lists external UI dependencies separately', () => {
    const definitions = {
      items: [
        item('root', {
          registryDependencies: [
            '@supabase/first',
            'https://supabase.com/library/r/second.json',
            'button',
          ],
        }),
        item('first', { registryDependencies: ['@supabase/shared', 'card'] }),
        item('second', { registryDependencies: ['@supabase/shared', 'button'] }),
        item('shared'),
      ],
    }
    const before = JSON.stringify(definitions)
    const resolved = resolveRegistryItem(definitions, 'root')
    expect(resolved.firstPartyDependencies).toEqual(['first', 'shared', 'second'])
    expect(resolved.externalRegistryDependencies).toEqual(['card', 'button'])
    expect(resolved.files.length).toBe(4)
    expect(JSON.stringify(definitions)).toBe(before)
  })

  it('fails with context for missing local dependencies and cycles', () => {
    expect(() =>
      resolveRegistryItem(
        { items: [item('root', { registryDependencies: ['@supabase/missing'] })] },
        'root'
      )
    ).toThrow(/"root" references missing dependency "missing"/)
    expect(() =>
      resolveRegistryItem(
        {
          items: [
            item('root', { registryDependencies: ['@supabase/child'] }),
            item('child', { registryDependencies: ['@supabase/root'] }),
          ],
        },
        'root'
      )
    ).toThrow(/Registry dependency cycle: root -> child -> root/)
    expect(() => resolveRegistryItem({ items: [item('root'), item('root')] }, 'root')).toThrow(
      /Duplicate registry item "root"/
    )
  })

  it('rejects destination collisions across composed files and local dependencies', () => {
    const conflicting = item('dependency', {
      files: [{ path: 'other.ts', target: 'lib/root.ts', type: 'registry:lib' }],
    })
    expect(() => registryItemAppend(item('root'), [conflicting])).toThrow(
      /conflicting destination "lib\/root.ts"/
    )
    expect(() =>
      resolveRegistryItem(
        {
          items: [item('root', { registryDependencies: ['@supabase/dependency'] }), conflicting],
        },
        'root'
      )
    ).toThrow(/conflicting destination "lib\/root.ts"/)
    expect(() =>
      resolveRegistryItem(
        {
          items: [
            item('root', {
              files: [
                { path: 'lib', target: 'lib', type: 'registry:file' },
                { path: 'lib/client.ts', type: 'registry:lib' },
              ],
            }),
          ],
        },
        'root'
      )
    ).toThrow(/file "lib" conflicts with directory/)
  })

  it('normalizes source packaging and explicit targets consistently', () => {
    expect(getInstalledPath({ path: 'registry/default/platform/example/lib/client.ts' })).toBe(
      'lib/client.ts'
    )
    expect(
      getInstalledPath({
        path: 'node_modules/@supabase/vue-blocks/registry/default/clients/vue/lib/supabase/client.ts',
      })
    ).toBe('lib/supabase/client.ts')
    expect(getInstalledPath({ path: 'some/source.ts', target: './app/client.ts' })).toBe(
      'app/client.ts'
    )
    // `~/` keeps backend files out of the installing project's src directory.
    expect(
      getInstalledPath({
        path: 'registry/default/blocks/mcp-server/supabase/functions/mcp-server/index.ts',
        target: '~/supabase/functions/mcp-server/index.ts',
      })
    ).toBe('supabase/functions/mcp-server/index.ts')
    expect(() => getInstalledPath({ path: 'source.ts', target: '../outside.ts' })).toThrow(
      /Invalid installed path/
    )
  })

  it('normalizes Vue library source paths for alias-aware installation without overriding targets', () => {
    const source = registry.items.find((item) => item.name === 'supabase-client-nuxtjs')!
    const before = JSON.stringify(source.files)
    const files = normalizeVueRegistryFiles(source.files ?? [])
    expect(files[0].path).toBe('lib/supabase/client.ts')
    expect(files[0].target).toBeUndefined()
    expect(files.slice(1)).toEqual(source.files?.slice(1))
    expect(JSON.stringify(source.files)).toBe(before)
    expect(normalizeVueRegistryFiles(files)).toEqual(files)
  })

  it('validates the published registry definitions and includes safe-next-path in auth inventory', () => {
    registrySchema.parse(registry)
    for (const definition of registry.items) {
      resolveRegistryItem(registry, definition.name)
    }
    const auth = resolveRegistryItem(registry, 'password-based-auth-nextjs')
    expect(auth.files.some((file) => getInstalledPath(file) === 'lib/safe-next-path.ts')).toBe(true)
    expect(auth.firstPartyDependencies).toEqual(['safe-next-path'])
    expect(auth.externalRegistryDependencies).toEqual(['button', 'card', 'input', 'label'])
    const tree = generateRegistryTree(
      new URL('../public/r/password-based-auth-nextjs.json', import.meta.url).pathname
    )
    expect(treePaths(tree).sort()).toEqual(auth.files.map(getInstalledPath).sort())
  })

  it('requires valid root and local dependency artifacts with source content', ({
    onTestFinished,
  }) => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'library-registry-test-'))
    onTestFinished(() => rmSync(directory, { recursive: true, force: true }))
    const registryPath = path.join(directory, 'root.json')
    expect(() => generateRegistryTree(registryPath)).toThrow(
      /required registry artifact.*root.json/
    )
    writeFileSync(registryPath, '{')
    expect(() => generateRegistryTree(registryPath)).toThrow(
      /required registry artifact.*root.json/
    )
    writeFileSync(
      registryPath,
      JSON.stringify(item('root', { registryDependencies: ['@supabase/child'] }))
    )
    expect(() => generateRegistryTree(registryPath)).toThrow(
      /Registry item "root" requires dependency "child"/
    )
    writeFileSync(path.join(directory, 'child.json'), JSON.stringify(item('child')))
    expect(treePaths(generateRegistryTree(registryPath)).sort()).toEqual([
      'lib/child.ts',
      'lib/root.ts',
    ])
    writeFileSync(
      path.join(directory, 'child.json'),
      JSON.stringify(item('child', { files: [{ path: 'lib/child.ts', type: 'registry:lib' }] }))
    )
    expect(() => generateRegistryTree(registryPath)).toThrow(
      /Registry item "root" requires dependency "child"/
    )
  })
})
