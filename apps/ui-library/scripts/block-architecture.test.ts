import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { starterSources, type StarterSourceSnapshot } from '../config/starter-sources'
import { getBlockArchitecture } from '../lib/block-architecture'
import { getInstalledPath, resolveRegistryItem } from '../lib/registry-resolution'
import { registry } from '../registry'
import { collectMdxFiles } from './library-documents'

const resourceKinds = new Set(['table', 'edge-function', 'api-route', 'page'])

describe('generated block architecture', () => {
  it('resolves every documentation overview to resources supported by source files', () => {
    const directory = fileURLToPath(new URL('../content/docs/', import.meta.url))
    const pages = collectMdxFiles(directory).filter((file) => !file.includes('/getting-started/'))
    assert.ok(pages.length > 0)
    for (const page of pages) {
      const source = readFileSync(page, 'utf8')
      assert.doesNotMatch(source, /<RegistryBlock|^## Folder structure/m, page)
      const overviews = Array.from(source.matchAll(/<BlockOverview\s+name="([^"]+)"/g))
      assert.equal(overviews.length, 1, `${page} must render one architecture overview`)
      const name = overviews[0][1]
      const architecture = getBlockArchitecture(name)
      assert.equal(architecture.name, name)
      assert.ok(architecture.title.trim(), `${name} has no title`)
      assert.ok(Array.isArray(architecture.diagnostics), `${name} has no diagnostics list`)
      assert.equal(
        new Set(architecture.resources.map((resource) => resource.id)).size,
        architecture.resources.length,
        name
      )
      for (const resource of architecture.resources) {
        assert.ok(
          resourceKinds.has(resource.kind),
          `${name}: unsupported resource ${resource.kind}`
        )
        assert.ok(resource.name.trim(), `${name}: unnamed resource`)
        assert.ok(resource.files.length > 0, `${name}: ${resource.id} has no source files`)
      }
      if (/<BlockOverview\b[^>]*\bshowFiles\b/.test(source)) {
        const resolved = resolveRegistryItem(registry, name)
        const installedPaths = new Set(resolved.files.map(getInstalledPath))
        assert.equal(architecture.fileCount, installedPaths.size, name)
        for (const resource of architecture.resources) {
          assert.ok(
            resource.files.every((file) => installedPaths.has(file)),
            `${name}: ${resource.id} references files outside its resolved registry`
          )
        }
      }
    }
  })

  it('does not invent primitive resources for blocks containing only client or component files', () => {
    for (const name of ['supabase-client-nextjs', 'dropzone-nextjs', 'infinite-query-composable']) {
      const architecture = getBlockArchitecture(name)
      assert.ok(architecture.fileCount > 0, name)
      assert.deepEqual(architecture.resources, [], name)
    }
  })

  it('groups MCP source evidence into one Edge Function and keeps the full installed file count', () => {
    const architecture = getBlockArchitecture('mcp-server')
    assert.equal(architecture.fileCount, 7)
    assert.equal(architecture.resources.length, 1)
    const resource = architecture.resources[0]
    assert.equal(resource.kind, 'edge-function')
    assert.equal(resource.name, 'mcp-server')
    assert.equal(resource.files.length, 6)
    assert.ok(resource.files.every((file) => file.startsWith('supabase/functions/mcp-server/')))
    assert.ok(resource.files.includes('supabase/functions/mcp-server/index.ts'))
    assert.ok(!resource.files.includes('supabase/functions/mcp-server/.env.example'))
  })

  it('detects Next.js authentication pages and the confirmation API route without inventing tables', () => {
    const architecture = getBlockArchitecture('password-based-auth-nextjs')
    assert.equal(
      architecture.resources.find((resource) => resource.route === '/auth/login')?.kind,
      'page'
    )
    assert.equal(
      architecture.resources.find((resource) => resource.route === '/auth/confirm')?.kind,
      'api-route'
    )
    assert.equal(architecture.resources.filter((resource) => resource.kind === 'page').length, 7)
    assert.equal(architecture.resources.filter((resource) => resource.kind === 'table').length, 0)
    assert.ok(
      architecture.resources.every(
        (resource) => resource.kind === 'page' || resource.kind === 'api-route'
      )
    )
  })

  it('retains the exact pinned starter source provenance and file evidence', () => {
    for (const descriptor of starterSources) {
      const snapshot: StarterSourceSnapshot = JSON.parse(
        readFileSync(
          new URL(`../registry/starter-sources/${descriptor.name}.json`, import.meta.url),
          'utf8'
        )
      )
      const architecture = getBlockArchitecture(descriptor.name)
      assert.deepEqual(architecture.source, {
        url: snapshot.source.treeUrl,
        revision: snapshot.source.revision,
      })
      assert.equal(architecture.fileCount, snapshot.files.length)
      const inputPaths = new Set(snapshot.files.map((file) => file.path))
      assert.ok(architecture.resources.length > 0, descriptor.name)
      assert.ok(
        architecture.resources.every((resource) =>
          resource.files.every((file) => inputPaths.has(file))
        ),
        descriptor.name
      )
    }
  })

  it('derives the Flutter profiles table and screens from the template snapshot', () => {
    const architecture = getBlockArchitecture('flutter-starter')
    const profiles = architecture.resources.find(
      (resource) => resource.kind === 'table' && resource.name === 'profiles'
    )
    assert.ok(profiles)
    assert.equal(profiles.schema, 'public')
    assert.deepEqual(profiles.files, ['supabase/migrations/20240404030631_init.sql'])
    assert.ok(
      architecture.resources.some(
        (resource) =>
          resource.kind === 'page' && resource.files.includes('lib/pages/splash_page.dart')
      )
    )
    assert.equal(architecture.resources.filter((resource) => resource.kind === 'table').length, 1)
  })

  it('rejects missing block names instead of returning a fabricated overview', () => {
    for (const name of ['missing-block', '__proto__', 'constructor']) {
      assert.throws(() => getBlockArchitecture(name), /Missing generated resources for block/)
    }
  })
})
