import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteSnippet, getSnippets, saveSnippet, updateSnippet } from '@/lib/api/snippets.utils'
import { Route } from '@/routes/api/platform/projects/$ref/content/index'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('@/lib/api/snippets.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/snippets.utils')>()
  return {
    ...actual,
    getSnippets: vi.fn(),
    updateSnippet: vi.fn(),
    saveSnippet: vi.fn(),
    deleteSnippet: vi.fn(),
  }
})

describe('/api/platform/projects/$ref/content', () => {
  beforeEach(() => {
    vi.mocked(getSnippets).mockReset()
    vi.mocked(updateSnippet).mockReset()
    vi.mocked(saveSnippet).mockReset()
    vi.mocked(deleteSnippet).mockReset()
  })

  it('creates a snippet when PUT update reports not found without re-reading the request stream', async () => {
    const snippetId = '11111111-1111-4111-8111-111111111111'
    const payload = {
      id: snippetId,
      owner_id: 1,
      project_id: 1,
      name: 'My Query',
      type: 'sql',
      visibility: 'user',
      content: { content_id: snippetId, schema_version: '1.0', sql: 'select 1;' },
    }
    vi.mocked(updateSnippet).mockRejectedValue(new Error('Snippet not found'))
    vi.mocked(saveSnippet).mockResolvedValue(payload as never)

    const response = await getRouteHandler(
      Route,
      'PUT'
    )({
      request: new Request('http://localhost/api/platform/projects/default/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(200)
    expect(saveSnippet).toHaveBeenCalledOnce()
    expect(await response.json()).toEqual(payload)
  })

  it('deletes comma-separated snippet IDs on DELETE', async () => {
    const id1 = '11111111-1111-4111-8111-111111111111'
    const id2 = '22222222-2222-4222-8222-222222222222'
    vi.mocked(deleteSnippet).mockResolvedValue(undefined as never)

    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request(
        `http://localhost/api/platform/projects/default/content?ids=${id1},${id2}`,
        { method: 'DELETE' }
      ),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ id: id1 }, { id: id2 }])
  })

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
