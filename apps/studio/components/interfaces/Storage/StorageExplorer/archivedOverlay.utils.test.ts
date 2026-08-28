import { describe, expect, it } from 'vitest'

import { STORAGE_ROW_TYPES } from '../Storage.constants'
import { getArchivedOverlayItems, getArchivedSegments } from './archivedOverlay.utils'
import type { ArchivedObject } from '@/data/storage/versioning/archived-objects-query'

const archived = (path: string, overrides: Partial<ArchivedObject> = {}): ArchivedObject => ({
  id: `id-${path}`,
  path,
  archivedAt: '2026-08-01T00:00:00Z',
  currentVersion: {
    versionId: `v-${path}`,
    size: 1024,
    createdAt: '2026-07-01T00:00:00Z',
    action: 'overwrite',
  },
  noncurrentVersions: [],
  ...overrides,
})

const overlay = (
  folderSegments: string[],
  archivedObjects: ArchivedObject[],
  existingItemNames: string[] = []
) =>
  getArchivedOverlayItems({
    folderSegments,
    archivedObjects,
    existingItemNames: new Set(existingItemNames),
  })

describe('getArchivedSegments', () => {
  it('splits a nested path into segments', () => {
    expect(getArchivedSegments(archived('matches/round-3/final.png'))).toEqual([
      'matches',
      'round-3',
      'final.png',
    ])
  })

  it('tolerates leading, trailing and repeated slashes', () => {
    expect(getArchivedSegments(archived('/matches//round-3/final.png/'))).toEqual([
      'matches',
      'round-3',
      'final.png',
    ])
  })

  it('handles a file at the bucket root', () => {
    expect(getArchivedSegments(archived('logo.svg'))).toEqual(['logo.svg'])
  })
})

describe('getArchivedOverlayItems', () => {
  it('returns nothing when there is nothing archived', () => {
    expect(overlay([], [])).toEqual([])
  })

  it('surfaces a root-level object as a file row at the root', () => {
    const [row] = overlay([], [archived('logo.svg')])
    expect(row.name).toBe('logo.svg')
    expect(row.type).toBe(STORAGE_ROW_TYPES.FILE)
    expect(row.archived).toEqual({ archivedObjectId: 'id-logo.svg' })
    expect(row.path).toBe('logo.svg')
  })

  it('carries the archived size and timestamp onto the row', () => {
    const [row] = overlay([], [archived('logo.svg')])
    expect(row.metadata?.size).toBe(1024)
    expect(row.updated_at).toBe('2026-08-01T00:00:00Z')
  })

  it('does not surface a root object when viewing a subfolder', () => {
    expect(overlay(['matches'], [archived('logo.svg')])).toEqual([])
  })

  it('surfaces a nested object as a folder row one level up', () => {
    const rows = overlay([], [archived('matches/final.png')])
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('matches')
    expect(rows[0].type).toBe(STORAGE_ROW_TYPES.FOLDER)
    expect(rows[0].archived).toEqual({})
  })

  it('surfaces the file itself once inside that folder', () => {
    const rows = overlay(['matches'], [archived('matches/final.png')])
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('final.png')
    expect(rows[0].type).toBe(STORAGE_ROW_TYPES.FILE)
  })

  it('coalesces several objects under one subfolder into a single row', () => {
    const rows = overlay(
      [],
      [archived('matches/a.png'), archived('matches/b.png'), archived('matches/deep/c.png')]
    )
    expect(rows.map((r) => r.name)).toEqual(['matches'])
  })

  it('skips a folder that already exists in the live listing', () => {
    expect(overlay([], [archived('matches/final.png')], ['matches'])).toEqual([])
  })

  it('skips a file that already exists in the live listing', () => {
    expect(overlay([], [archived('logo.svg')], ['logo.svg'])).toEqual([])
  })

  it('orders folders before files', () => {
    const rows = overlay([], [archived('logo.svg'), archived('matches/final.png')])
    expect(rows.map((r) => r.type)).toEqual([STORAGE_ROW_TYPES.FOLDER, STORAGE_ROW_TYPES.FILE])
  })

  it('only descends one level at a time', () => {
    const rows = overlay([], [archived('a/b/c/d.png')])
    expect(rows.map((r) => r.name)).toEqual(['a'])
    expect(overlay(['a'], [archived('a/b/c/d.png')]).map((r) => r.name)).toEqual(['b'])
  })
})
