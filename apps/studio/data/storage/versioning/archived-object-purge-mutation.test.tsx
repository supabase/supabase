import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useArchivedObjectPurgeMutation } from './archived-object-purge-mutation'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ListRow = {
  name: string
  version: string
  created_at: string
  archived_at?: string | null
  is_delete_marker?: boolean
}

const PATH = 'images/gone.png'
const MARKER = 'v-marker'

const row = (version: string, overrides: Partial<ListRow> = {}): ListRow => ({
  name: PATH,
  version,
  created_at: '2026-01-01T00:00:00Z',
  archived_at: '2026-02-01T00:00:00Z',
  ...overrides,
})

const marker = (version = MARKER) =>
  row(version, { archived_at: null, is_delete_marker: true, created_at: '2026-02-01T00:00:00Z' })

/** Successive responses from the list endpoint, one per round the purge runs. */
const mockListPages = (pages: ListRow[][]) => {
  let call = 0
  addAPIMock({
    method: 'post',
    path: '/platform/storage/:ref/buckets/:id/objects/list',
    response: () => Response.json(pages[Math.min(call++, pages.length - 1)]),
  })
}

const purge = () =>
  customRenderHook(() => useArchivedObjectPurgeMutation()).result.current.mutateAsync({
    projectRef: 'abcdef',
    bucketId: 'my-bucket',
    archivedObjectId: MARKER,
    path: PATH,
  })

describe('useArchivedObjectPurgeMutation', () => {
  let deleted: string[][] = []

  beforeEach(() => {
    deleted = []
    addAPIMock({
      method: 'delete',
      path: '/platform/storage/:ref/buckets/:id/objects',
      response: async ({ request }) => {
        const body = (await request.json()) as { paths: { versionId: string }[] }
        deleted.push(body.paths.map((entry) => entry.versionId))
        return Response.json({})
      },
    })
  })

  it('keeps listing until the history is gone, since one page is capped at 1000 rows', async () => {
    mockListPages([[marker(), row('v2'), row('v1')], [row('v1')], []])

    await purge()

    await waitFor(() => expect(deleted).toHaveLength(2))
    expect(deleted[0]).toEqual([MARKER, 'v2', 'v1'])
    expect(deleted[1]).toEqual(['v1'])
  })

  it('refuses to delete anything once the file has been restored', async () => {
    // No delete marker on top: something un-archived the path after the dialog opened.
    mockListPages([[row('v2', { archived_at: null }), row('v1')]])

    await expect(purge()).rejects.toThrow(/no longer archived/)
    expect(deleted).toEqual([])
  })

  it('stops rather than delete a version that went live mid-purge', async () => {
    // The first round clears the history; by the second, the path has been written again.
    mockListPages([[marker(), row('v2')], [row('v-new', { archived_at: null })]])

    await expect(purge()).rejects.toThrow(/restored or replaced/)
    expect(deleted).toEqual([[MARKER, 'v2']])
  })

  it('gives up rather than spin when a round deletes nothing', async () => {
    mockListPages([[marker(), row('v1')]])

    await expect(purge()).rejects.toThrow(/could not be deleted/)
    expect(deleted).toHaveLength(1)
  })
})
