import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Snippet } from '@/lib/api/snippets.utils'
import { getRouteHandler } from '@/tests/lib/server-route'

type ContentRoute = typeof import('@/routes/api/platform/projects/$ref/content/index').Route

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
  const id = overrides.id ?? '11111111-1111-4111-8111-111111111111'
  return {
    id,
    inserted_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    type: 'sql',
    name: 'My Query',
    description: '',
    favorite: false,
    content: {
      sql: 'select 1;',
      content_id: id,
      schema_version: '1.0',
    },
    visibility: 'user',
    project_id: 1,
    folder_id: null,
    owner_id: 1,
    owner: { id: 1, username: 'johndoe' },
    updated_by: { id: 1, username: 'johndoe' },
    ...overrides,
  }
}

async function createSnippet(route: ContentRoute, overrides: Partial<Snippet> = {}) {
  const response = await getRouteHandler(
    route,
    'PUT'
  )({
    request: new Request('http://localhost/api/platform/projects/default/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeSnippet(overrides)),
    }),
    params: { ref: 'default' },
  })
  return { response, snippet: (await response.json()) as Snippet }
}

describe('/api/platform/projects/$ref/content', () => {
  let tempDir: string
  let Route: ContentRoute

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-content-test-'))
    vi.resetModules()
    vi.stubEnv('SNIPPETS_MANAGEMENT_FOLDER', tempDir)
    ;({ Route } = await import('@/routes/api/platform/projects/$ref/content/index'))
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('creates and persists a snippet on disk when PUT update reports not found', async () => {
    const { response, snippet } = await createSnippet(Route, {
      name: 'My Query',
      content: {
        sql: 'select 1;',
        content_id: '11111111-1111-4111-8111-111111111111',
        schema_version: '1.0',
      },
    })

    expect(response.status).toBe(200)
    expect(snippet).toMatchObject({
      name: 'My Query',
      type: 'sql',
      visibility: 'user',
      folder_id: null,
      content: {
        sql: 'select 1;',
        schema_version: '1.0',
      },
    })
    expect(await fs.readFile(path.join(tempDir, 'My Query.sql'), 'utf-8')).toBe('select 1;')
  })

  it('deletes comma-separated snippet IDs from disk on DELETE', async () => {
    const { snippet: first } = await createSnippet(Route, {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'First Query',
    })
    const { snippet: second } = await createSnippet(Route, {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Second Query',
    })

    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request(
        `http://localhost/api/platform/projects/default/content?ids=${first.id},${second.id}`,
        { method: 'DELETE' }
      ),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ id: first.id }, { id: second.id }])
    expect(await fs.readdir(tempDir)).toEqual([])
  })

  it('returns 400 on DELETE with repeated ids parameters without deleting any snippet', async () => {
    const { snippet: first } = await createSnippet(Route, {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'First Query',
    })
    const { snippet: second } = await createSnippet(Route, {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Second Query',
    })

    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request(
        `http://localhost/api/platform/projects/default/content?ids=${first.id}&ids=${second.id}`,
        { method: 'DELETE' }
      ),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Snippet IDs are required' })
    expect((await fs.readdir(tempDir)).sort()).toEqual(['First Query.sql', 'Second Query.sql'])
  })

  it.each(['', '?ids=', '?ids=not-a-uuid'])(
    'returns 400 on DELETE when ids is missing or invalid (%s)',
    async (query) => {
      const response = await getRouteHandler(
        Route,
        'DELETE'
      )({
        request: new Request(`http://localhost/api/platform/projects/default/content${query}`, {
          method: 'DELETE',
        }),
        params: { ref: 'default' },
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Snippet IDs are required' })
    }
  )

  it('returns 405 with Allow: GET, PUT, DELETE for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/projects/default/content', {
        method: 'POST',
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('GET, PUT, DELETE')
  })
})
