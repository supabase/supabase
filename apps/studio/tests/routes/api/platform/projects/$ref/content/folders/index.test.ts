import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Folder } from '@/lib/api/snippets.utils'
import { callRoute } from '@/tests/lib/server-route'

type FoldersRoute = typeof import('@/routes/api/platform/projects/$ref/content/folders/index').Route
type FolderByIdRoute =
  typeof import('@/routes/api/platform/projects/$ref/content/folders/$id').Route

async function createFolder(route: FoldersRoute, name: string): Promise<Folder> {
  const response = await callRoute(
    route,
    new Request('http://localhost/api/platform/projects/default/content/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
    { ref: 'default' }
  )
  return (await response.json()) as Folder
}

describe('/api/platform/projects/$ref/content/folders', () => {
  let tempDir: string
  let Route: FoldersRoute
  let FolderRoute: FolderByIdRoute

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-folders-test-'))
    vi.resetModules()
    vi.stubEnv('SNIPPETS_MANAGEMENT_FOLDER', tempDir)
    ;({ Route } = await import('@/routes/api/platform/projects/$ref/content/folders/index'))
    ;({ Route: FolderRoute } =
      await import('@/routes/api/platform/projects/$ref/content/folders/$id'))
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('lists folders and paginated snippet metadata on GET with valid query params', async () => {
    await createFolder(Route, 'Reports')
    await fs.writeFile(path.join(tempDir, 'alpha.sql'), 'select 1;', 'utf-8')
    await fs.writeFile(path.join(tempDir, 'beta.sql'), 'select 2;', 'utf-8')

    const response = await callRoute(
      Route,
      new Request(
        'http://localhost/api/platform/projects/default/content/folders?limit=1&sort_by=name&sort_order=asc'
      ),
      { ref: 'default' }
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.folders).toEqual([expect.objectContaining({ name: 'Reports' })])
    expect(body.data.contents).toEqual([expect.objectContaining({ name: 'alpha' })])
    expect(body.data.contents[0]).not.toHaveProperty('content')
    expect(body.cursor).toBe(body.data.contents[0].id)
  })

  it.each([
    '?limit=invalid',
    '?limit=0',
    '?sort_by=invalid',
    '?sort_order=invalid',
    '?limit=1&limit=2',
    '?sort_by=name&sort_by=inserted_at',
  ])('returns 400 on GET when query params are invalid or repeated (%s)', async (query) => {
    const response = await callRoute(
      Route,
      new Request(`http://localhost/api/platform/projects/default/content/folders${query}`),
      { ref: 'default' }
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ data: { folders: [], contents: [] } })
  })

  it.each(['?limit=invalid', '?limit=1&limit=2'])(
    'returns 400 on folder-by-id GET when query params are invalid or repeated (%s)',
    async (query) => {
      const response = await callRoute(
        FolderRoute,
        new Request(
          `http://localhost/api/platform/projects/default/content/folders/folder-1${query}`
        ),
        { ref: 'default', id: 'folder-1' }
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ data: { folders: [], contents: [] } })
    }
  )

  it('deletes comma-separated folder IDs from disk on DELETE', async () => {
    const folderA = await createFolder(Route, 'Folder A')
    const folderB = await createFolder(Route, 'Folder B')

    const response = await callRoute(
      Route,
      new Request(
        `http://localhost/api/platform/projects/default/content/folders?ids=${folderA.id},${folderB.id}`,
        { method: 'DELETE' }
      ),
      { ref: 'default' }
    )

    expect(response.status).toBe(200)
    expect(await fs.readdir(tempDir)).toEqual([])
  })

  it('returns 400 on DELETE with repeated ids parameters without deleting any folder', async () => {
    const folderA = await createFolder(Route, 'Folder A')
    const folderB = await createFolder(Route, 'Folder B')

    const response = await callRoute(
      Route,
      new Request(
        `http://localhost/api/platform/projects/default/content/folders?ids=${folderA.id}&ids=${folderB.id}`,
        { method: 'DELETE' }
      ),
      { ref: 'default' }
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Folder IDs are required' })
    expect((await fs.readdir(tempDir)).sort()).toEqual(['Folder A', 'Folder B'])
  })

  it.each(['', '?ids='])(
    'returns 400 on DELETE when ids is missing or empty (%s)',
    async (query) => {
      const response = await callRoute(
        Route,
        new Request(`http://localhost/api/platform/projects/default/content/folders${query}`, {
          method: 'DELETE',
        }),
        { ref: 'default' }
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Folder IDs are required' })
    }
  )
})
