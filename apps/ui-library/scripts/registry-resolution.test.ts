import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { registrySchema, type RegistryItem } from 'shadcn/schema'

import { generateRegistryTree, type RegistryNode } from '../lib/process-registry'
import {
  getInstalledPath,
  normalizeVueRegistryFiles,
  resolveRegistryItem,
} from '../lib/registry-resolution'
import { registry } from '../registry'
import { registryItemAppend } from '../registry/utils'

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
    assert.equal(composed.docs, 'Configure the block.\n\nSet the client environment variables.')
    assert.deepEqual(composed.dependencies, [])
    assert.deepEqual(composed.registryDependencies, [])
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
    assert.deepEqual(resolved.firstPartyDependencies, ['first', 'shared', 'second'])
    assert.deepEqual(resolved.externalRegistryDependencies, ['card', 'button'])
    assert.equal(resolved.files.length, 4)
    assert.equal(JSON.stringify(definitions), before)
  })

  it('fails with context for missing local dependencies and cycles', () => {
    assert.throws(
      () =>
        resolveRegistryItem(
          { items: [item('root', { registryDependencies: ['@supabase/missing'] })] },
          'root'
        ),
      /"root" references missing dependency "missing"/
    )
    assert.throws(
      () =>
        resolveRegistryItem(
          {
            items: [
              item('root', { registryDependencies: ['@supabase/child'] }),
              item('child', { registryDependencies: ['@supabase/root'] }),
            ],
          },
          'root'
        ),
      /Registry dependency cycle: root -> child -> root/
    )
    assert.throws(
      () => resolveRegistryItem({ items: [item('root'), item('root')] }, 'root'),
      /Duplicate registry item "root"/
    )
  })

  it('rejects destination collisions across composed files and local dependencies', () => {
    const conflicting = item('dependency', {
      files: [{ path: 'other.ts', target: 'lib/root.ts', type: 'registry:lib' }],
    })
    assert.throws(
      () => registryItemAppend(item('root'), [conflicting]),
      /conflicting destination "lib\/root.ts"/
    )
    assert.throws(
      () =>
        resolveRegistryItem(
          {
            items: [item('root', { registryDependencies: ['@supabase/dependency'] }), conflicting],
          },
          'root'
        ),
      /conflicting destination "lib\/root.ts"/
    )
    assert.throws(
      () =>
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
        ),
      /file "lib" conflicts with directory/
    )
  })

  it('normalizes source packaging and explicit targets consistently', () => {
    assert.equal(
      getInstalledPath({ path: 'registry/default/platform/example/lib/client.ts' }),
      'lib/client.ts'
    )
    assert.equal(
      getInstalledPath({
        path: 'node_modules/@supabase/vue-blocks/registry/default/clients/vue/lib/supabase/client.ts',
      }),
      'lib/supabase/client.ts'
    )
    assert.equal(
      getInstalledPath({ path: 'some/source.ts', target: './app/client.ts' }),
      'app/client.ts'
    )
    assert.throws(
      () => getInstalledPath({ path: 'source.ts', target: '../outside.ts' }),
      /Invalid installed path/
    )
  })

  it('normalizes Vue library source paths for alias-aware installation without overriding targets', () => {
    const source = registry.items.find((item) => item.name === 'supabase-client-nuxtjs')!
    const before = JSON.stringify(source.files)
    const files = normalizeVueRegistryFiles(source.files ?? [])
    assert.equal(files[0].path, 'lib/supabase/client.ts')
    assert.equal(files[0].target, undefined)
    assert.deepEqual(files.slice(1), source.files?.slice(1))
    assert.equal(JSON.stringify(source.files), before)
    assert.deepEqual(normalizeVueRegistryFiles(files), files)
  })

  it('validates the published registry definitions and includes safe-next-path in auth inventory', () => {
    registrySchema.parse(registry)
    for (const definition of registry.items) {
      resolveRegistryItem(registry, definition.name)
    }
    const auth = resolveRegistryItem(registry, 'password-based-auth-nextjs')
    assert.ok(auth.files.some((file) => getInstalledPath(file) === 'lib/safe-next-path.ts'))
    assert.deepEqual(auth.firstPartyDependencies, ['safe-next-path'])
    assert.deepEqual(auth.externalRegistryDependencies, ['button', 'card', 'input', 'label'])
    const tree = generateRegistryTree(
      new URL('../public/r/password-based-auth-nextjs.json', import.meta.url).pathname
    )
    assert.deepEqual(treePaths(tree).sort(), auth.files.map(getInstalledPath).sort())
  })

  it('requires valid root and local dependency artifacts with source content', (t) => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'library-registry-test-'))
    t.after(() => rmSync(directory, { recursive: true, force: true }))
    const registryPath = path.join(directory, 'root.json')
    assert.throws(() => generateRegistryTree(registryPath), /required registry artifact.*root.json/)
    writeFileSync(registryPath, '{')
    assert.throws(() => generateRegistryTree(registryPath), /required registry artifact.*root.json/)
    writeFileSync(
      registryPath,
      JSON.stringify(item('root', { registryDependencies: ['@supabase/child'] }))
    )
    assert.throws(
      () => generateRegistryTree(registryPath),
      /Registry item "root" requires dependency "child"/
    )
    writeFileSync(path.join(directory, 'child.json'), JSON.stringify(item('child')))
    assert.deepEqual(treePaths(generateRegistryTree(registryPath)).sort(), [
      'lib/child.ts',
      'lib/root.ts',
    ])
    writeFileSync(
      path.join(directory, 'child.json'),
      JSON.stringify(item('child', { files: [{ path: 'lib/child.ts', type: 'registry:lib' }] }))
    )
    assert.throws(
      () => generateRegistryTree(registryPath),
      /Registry item "root" requires dependency "child"/
    )
  })
})
