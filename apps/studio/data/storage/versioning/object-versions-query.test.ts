import { describe, expect, it } from 'vitest'

import { toObjectVersions } from './object-versions-query'

const object = (overrides: Record<string, unknown>) =>
  ({
    name: 'folder/photo.jpg',
    id: null,
    updated_at: null,
    created_at: null,
    last_accessed_at: null,
    metadata: { size: 100 },
    ...overrides,
  }) as any

describe('toObjectVersions', () => {
  it('returns newest first', () => {
    const versions = toObjectVersions([
      object({ version: 'old', created_at: '2026-01-01T00:00:00Z', archived_at: '2026-02-01' }),
      object({ version: 'new', created_at: '2026-03-01T00:00:00Z' }),
      object({ version: 'mid', created_at: '2026-02-01T00:00:00Z', archived_at: '2026-03-01' }),
    ])

    expect(versions.map((version) => version.versionId)).toEqual(['new', 'mid', 'old'])
  })

  it('treats a row with no archived_at as the current version', () => {
    const versions = toObjectVersions([
      object({ version: 'a', created_at: '2026-01-01T00:00:00Z' }),
      object({ version: 'b', created_at: '2026-02-01T00:00:00Z', archived_at: '2026-03-01' }),
    ])

    expect(versions.find((version) => version.versionId === 'a')?.isCurrent).toBe(true)
    expect(versions.find((version) => version.versionId === 'b')?.isCurrent).toBe(false)
  })

  it('labels the oldest upload and treats the rest as overwrites', () => {
    const versions = toObjectVersions([
      object({ version: 'a', created_at: '2026-01-01T00:00:00Z' }),
      object({ version: 'b', created_at: '2026-02-01T00:00:00Z' }),
      object({ version: 'c', created_at: '2026-03-01T00:00:00Z' }),
    ])

    expect(versions.map((version) => version.action)).toEqual([
      'overwrite',
      'overwrite',
      'initial upload',
    ])
  })

  it('labels delete markers and does not count them as the initial upload', () => {
    const versions = toObjectVersions([
      object({ version: 'upload', created_at: '2026-01-01T00:00:00Z' }),
      object({
        version: 'marker',
        created_at: '2026-02-01T00:00:00Z',
        is_delete_marker: true,
        metadata: null,
      }),
    ])

    expect(versions.map((version) => version.action)).toEqual(['delete marker', 'initial upload'])
  })

  it('reads the size off the metadata, defaulting to zero', () => {
    const versions = toObjectVersions([
      object({ version: 'a', created_at: '2026-01-01T00:00:00Z', metadata: { size: 2048 } }),
      object({ version: 'b', created_at: '2026-02-01T00:00:00Z', metadata: null }),
    ])

    expect(versions.find((version) => version.versionId === 'a')?.size).toBe(2048)
    expect(versions.find((version) => version.versionId === 'b')?.size).toBe(0)
  })

  it('drops rows the API returned without a version id', () => {
    expect(toObjectVersions([object({ created_at: '2026-01-01T00:00:00Z' })])).toEqual([])
  })
})
