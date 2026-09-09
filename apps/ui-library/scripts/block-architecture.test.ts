import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { starterArchitectureDefinitions } from '../config/starter-architecture'
import { generateBlockArchitecture, summarizeBlockArchitecture } from '../lib/block-architecture'
import { registry } from '../registry'

function registryItem(name: string) {
  return JSON.parse(
    readFileSync(
      new URL(`../registry/default/blocks/${name}/registry-item.json`, import.meta.url),
      'utf8'
    )
  )
}

describe('block architecture', () => {
  it('summarizes application structure without repeating implementation files', () => {
    const definition = registry.items.find((item) => item.name === 'password-based-auth-nextjs')!
    const overview = summarizeBlockArchitecture(generateBlockArchitecture(definition))
    assert.ok(
      overview.resources.every(
        (resource) =>
          !['client', 'hook', 'utility', 'config', 'file', 'migration'].includes(resource.kind)
      )
    )
    const signIn = overview.resources.find((resource) => resource.route === '/auth/login')!
    assert.equal(signIn.label, 'Sign in')
    assert.equal(signIn.description, 'Sign in with email and password')
    assert.ok(overview.resources.some((resource) => resource.label === 'Sign in form'))
    assert.ok(!overview.resources.some((resource) => /\.(tsx?|json)$/.test(resource.label)))
    assert.ok(
      overview.relationships.every(
        (relationship) =>
          overview.resources.some((resource) => resource.id === relationship.source) &&
          overview.resources.some((resource) => resource.id === relationship.target)
      )
    )
  })

  it('represents a headless block as one capability rather than its helper files', () => {
    const definition = registry.items.find((item) => item.name === 'supabase-client-nextjs')!
    const overview = summarizeBlockArchitecture(generateBlockArchitecture(definition))
    assert.equal(overview.resources.length, 1)
    assert.equal(overview.resources[0].kind, 'capability')
    assert.equal(overview.resources[0].label, definition.title)
  })

  it('groups all MCP implementation files into its single deployed Edge Function', () => {
    const definition = registryItem('mcp-server')
    const graph = generateBlockArchitecture(definition)
    assert.equal(graph.fileCount, definition.files.length)
    const functions = graph.resources.filter((resource) => resource.kind === 'edge-function')
    assert.equal(functions.length, 1)
    assert.equal(functions[0].label, 'MCP server')
    assert.equal(functions[0].files.length, 7)
  })

  it('derives Next.js pages, handlers, middleware, and components from the installed files', () => {
    const graph = generateBlockArchitecture(registryItem('password-based-auth-nextjs'))
    assert.equal(graph.resources.find((resource) => resource.route === '/auth/login')?.kind, 'page')
    assert.equal(
      graph.resources.find((resource) => resource.route === '/auth/confirm')?.kind,
      'route'
    )
    assert.ok(graph.resources.some((resource) => resource.kind === 'middleware'))
    assert.ok(
      graph.resources.some((resource) => resource.files.includes('components/login-form.tsx'))
    )
    assert.equal(graph.resources.filter((resource) => resource.kind === 'page').length, 7)
    assert.equal(graph.resources.filter((resource) => resource.kind === 'component').length, 5)
    assert.ok(
      graph.resources
        .filter((resource) => resource.files.length)
        .every((resource) => resource.status === 'added')
    )
  })

  it('distinguishes framework middleware from the Supabase session helper', () => {
    const definition = registry.items.find((item) => item.name === 'password-based-auth-nextjs')!
    const graph = generateBlockArchitecture(definition)
    assert.equal(graph.resources.filter((resource) => resource.kind === 'middleware').length, 1)
    assert.equal(
      graph.resources.find((resource) => resource.files.includes('lib/supabase/middleware.ts'))
        ?.kind,
      'client'
    )
  })

  it('derives flat React Router and pathless TanStack routes without claiming runtime connections', () => {
    const router = generateBlockArchitecture(registryItem('password-based-auth-react-router'))
    assert.equal(
      router.resources.find((resource) => resource.route === '/auth/confirm')?.kind,
      'route'
    )
    assert.equal(
      router.resources.find((resource) => resource.files[0] === 'app/routes.ts')?.kind,
      'file'
    )
    const tanstack = generateBlockArchitecture(registryItem('password-based-auth-tanstack'))
    assert.equal(
      tanstack.resources.find((resource) => resource.route === '/protected')?.kind,
      'route'
    )
    assert.equal(
      tanstack.resources.find((resource) => resource.files[0] === 'routes/_protected.tsx')?.kind,
      'layout'
    )
    assert.deepEqual(tanstack.relationships, [])
  })

  it('handles route groups, index routes, dynamic routes, Vue pages, and server handlers', () => {
    const graph = generateBlockArchitecture({
      name: 'routes',
      files: [
        { path: 'app/(auth)/login/page.tsx' },
        { path: 'app/index/page.tsx' },
        { path: 'app/notpage.tsx' },
        { path: 'routes/_app.users.$id.tsx' },
        { path: 'pages/account/index.vue' },
        { path: 'server/api/profile.get.ts' },
      ],
    })
    assert.equal(graph.resources[0].route, '/login')
    assert.equal(graph.resources[1].route, '/index')
    assert.equal(graph.resources[2].kind, 'file')
    assert.equal(graph.resources[3].route, '/users/:id')
    assert.equal(graph.resources[4].route, '/account')
    assert.equal(graph.resources[5].kind, 'route')
    assert.equal(graph.resources[5].route, '/api/profile')
  })

  it('shows SQL migrations without inventing database tables from their filenames', () => {
    const graph = generateBlockArchitecture({
      name: 'database',
      files: [{ path: 'supabase/migrations/20260101_create_users.sql' }],
    })
    assert.equal(graph.resources[0].kind, 'migration')
    assert.ok(!graph.resources.some((resource) => resource.kind === 'table'))
    assert.equal(generateBlockArchitecture({ name: 'empty' }).resources.length, 0)
  })

  it('uses explicit resources and relationships to describe database and service architecture', () => {
    const graph = generateBlockArchitecture({
      name: 'upload',
      files: [{ path: 'components/uploader.tsx', type: 'registry:component' }],
      meta: {
        architecture: {
          resources: [
            {
              id: 'uploader',
              label: 'Uploader',
              kind: 'component',
              files: ['components/uploader.tsx'],
            },
            { id: 'uploads', label: 'uploads', kind: 'table', description: 'Upload metadata' },
            { id: 'storage', label: 'Files', kind: 'bucket', status: 'existing' },
          ],
          relationships: [
            { source: 'uploader', target: 'uploads', label: 'Saves metadata' },
            {
              source: 'component:components/uploader.tsx',
              target: 'storage',
              label: 'Uploads files',
            },
            { source: 'uploader', target: 'uploads', label: 'Saves metadata' },
            { source: 'uploader', target: 'missing' },
          ],
        },
      },
    })
    assert.equal(graph.fileCount, 1)
    assert.equal(graph.resources.length, 3)
    assert.equal(graph.resources.find((resource) => resource.id === 'storage')?.status, 'existing')
    assert.equal(graph.resources.find((resource) => resource.id === 'uploads')?.status, 'added')
    assert.equal(graph.relationships.length, 2)
    assert.equal(graph.relationships[1].source, 'uploader')
  })

  it('deduplicates installed destinations and does not mutate the block definition', () => {
    const definition = {
      name: 'hook',
      files: [
        { path: 'registry/default/blocks/hook/hooks/use-data.ts', type: 'registry:hook' },
        { path: 'other/source.ts', target: './hooks/use-data.ts', type: 'registry:hook' },
      ],
    }
    const before = JSON.stringify(definition)
    const first = generateBlockArchitecture(definition)
    assert.equal(first.fileCount, 1)
    assert.equal(first.resources[0].kind, 'hook')
    assert.deepEqual(generateBlockArchitecture(definition), first)
    assert.equal(JSON.stringify(definition), before)
  })

  it('resolves every block documentation overview to exactly one nonempty architecture definition', () => {
    const directory = new URL('../content/docs/', import.meta.url)
    const pages = readdirSync(directory, { recursive: true })
      .filter((file): file is string => typeof file === 'string')
      .filter((file) => file.endsWith('.mdx') && !file.startsWith('getting-started/'))
    const definitions = [...registry.items, ...starterArchitectureDefinitions]
    assert.ok(pages.length > 0)
    for (const page of pages) {
      const source = readFileSync(new URL(page, directory), 'utf8')
      assert.doesNotMatch(
        source,
        /<RegistryBlock|^## Folder structure/m,
        `${page} duplicates the file tab in the body`
      )
      const overviews = Array.from(source.matchAll(/<BlockOverview\s+name="([^"]+)"/g))
      assert.equal(overviews.length, 1, `${page} must render one architecture overview`)
      if (/<BlockOverview\b[^>]*\bshowFiles\b/.test(source)) {
        const files = JSON.parse(
          readFileSync(new URL(`../public/r/${overviews[0][1]}.json`, import.meta.url), 'utf8')
        ).files
        assert.ok(files.length > 0, `${page} has no files for its Files tab`)
      }
      const matches = definitions.filter((definition) => definition.name === overviews[0][1])
      assert.equal(matches.length, 1, `${page} must resolve to one definition`)
      const graph = generateBlockArchitecture(matches[0])
      assert.ok(graph.resources.length > 0, `${page} must describe its architecture`)
      assert.equal(
        new Set(graph.resources.map((resource) => resource.id)).size,
        graph.resources.length
      )
      assert.ok(
        graph.relationships.every(
          (relationship) =>
            graph.resources.some((resource) => resource.id === relationship.source) &&
            graph.resources.some((resource) => resource.id === relationship.target)
        ),
        `${page} has invalid relationship endpoints`
      )
    }
  })

  it('declares MCP authentication as an existing service connected to the added function', () => {
    const definition = registry.items.find((item) => item.name === 'mcp-server')
    assert.ok(definition)
    const graph = generateBlockArchitecture(definition)
    const edgeFunction = graph.resources.find((resource) => resource.kind === 'edge-function')
    const auth = graph.resources.find(
      (resource) => resource.kind === 'service' && /auth/i.test(resource.label)
    )
    assert.ok(edgeFunction)
    assert.ok(auth)
    assert.equal(edgeFunction.status, 'added')
    assert.equal(auth.status, 'existing')
    assert.ok(
      graph.relationships.some(
        (relationship) => relationship.source === edgeFunction.id && relationship.target === auth.id
      )
    )
  })
})
