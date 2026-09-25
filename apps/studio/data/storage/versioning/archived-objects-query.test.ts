import { describe, expect, it } from 'vitest'

import { toArchivedObjects } from './archived-objects-query'

const row = (overrides: Record<string, unknown>) =>
  ({
    name: 'folder/photo.jpg',
    id: 'id',
    updated_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    last_accessed_at: '2026-01-01T00:00:00Z',
    metadata: { size: 100, mimetype: 'image/jpeg' },
    ...overrides,
  }) as any

describe('toArchivedObjects', () => {
  it('treats an object whose top row is a delete marker as archived', () => {
    const archived = toArchivedObjects([
      row({ version: 'v1', created_at: '2026-01-01T00:00:00Z', archived_at: '2026-02-01' }),
      row({
        version: 'marker',
        created_at: '2026-02-01T00:00:00Z',
        is_delete_marker: true,
        metadata: null,
      }),
    ])

    expect(archived).toHaveLength(1)
    expect(archived[0].id).toBe('marker')
    expect(archived[0].path).toBe('folder/photo.jpg')
    expect(archived[0].archivedAt).toBe('2026-02-01T00:00:00Z')
    expect(archived[0].currentVersion.versionId).toBe('v1')
    // The preview needs it to decide what to render.
    expect(archived[0].currentVersion.mimeType).toBe('image/jpeg')
  })

  it('ignores a live object', () => {
    expect(
      toArchivedObjects([
        row({ version: 'v1', created_at: '2026-01-01T00:00:00Z', archived_at: '2026-02-01' }),
        row({ version: 'v2', created_at: '2026-02-01T00:00:00Z' }),
      ])
    ).toEqual([])
  })

  it('surfaces the version live at archive time, with the rest behind it newest first', () => {
    const archived = toArchivedObjects([
      row({ version: 'oldest', created_at: '2026-01-01T00:00:00Z', archived_at: '2026-02-01' }),
      row({ version: 'middle', created_at: '2026-02-01T00:00:00Z', archived_at: '2026-03-01' }),
      row({ version: 'newest', created_at: '2026-03-01T00:00:00Z', archived_at: '2026-04-01' }),
      row({
        version: 'marker',
        created_at: '2026-04-01T00:00:00Z',
        is_delete_marker: true,
        metadata: null,
      }),
    ])

    expect(archived[0].currentVersion.versionId).toBe('newest')
    expect(archived[0].noncurrentVersions.map((v) => v.versionId)).toEqual(['middle', 'oldest'])
    expect(archived[0].noncurrentVersions.map((v) => v.action)).toEqual([
      'overwrite',
      'initial upload',
    ])
  })

  it('skips a delete marker with nothing retained under it', () => {
    expect(
      toArchivedObjects([
        row({
          version: 'marker',
          created_at: '2026-02-01T00:00:00Z',
          is_delete_marker: true,
          metadata: null,
        }),
      ])
    ).toEqual([])
  })

  it('groups rows by path and returns the most recently archived first', () => {
    const archived = toArchivedObjects([
      row({ name: 'a.txt', version: 'a1', created_at: '2026-01-01T00:00:00Z', archived_at: 'x' }),
      row({
        name: 'a.txt',
        version: 'a-marker',
        created_at: '2026-02-01T00:00:00Z',
        is_delete_marker: true,
      }),
      row({
        name: 'deep/b.txt',
        version: 'b1',
        created_at: '2026-01-01T00:00:00Z',
        archived_at: 'x',
      }),
      row({
        name: 'deep/b.txt',
        version: 'b-marker',
        created_at: '2026-03-01T00:00:00Z',
        is_delete_marker: true,
      }),
    ])

    expect(archived.map((object) => object.path)).toEqual(['deep/b.txt', 'a.txt'])
  })

  it('drops rows the API returned without a version id', () => {
    expect(toArchivedObjects([row({ is_delete_marker: true })])).toEqual([])
  })
})
