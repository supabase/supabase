import { describe, expect, it } from 'vitest'

import { getMergedArchivedVersions } from './archivedVersions.utils'
import type { ArchivedObject } from '@/data/storage/versioning/archived-objects-query'

const object: ArchivedObject = {
  id: 'obj-1',
  path: 'matches/final.png',
  archivedAt: '2026-08-10T00:00:00Z',
  currentVersion: {
    versionId: 'v-current',
    size: 900,
    createdAt: '2026-08-01T00:00:00Z',
    action: 'overwrite',
  },
  noncurrentVersions: [
    { versionId: 'v-2', size: 800, createdAt: '2026-07-20T00:00:00Z', action: 'overwrite' },
    { versionId: 'v-1', size: 700, createdAt: '2026-07-01T00:00:00Z', action: 'initial upload' },
  ],
}

describe('getMergedArchivedVersions', () => {
  it('puts the version that was live at archive time first', () => {
    const [first] = getMergedArchivedVersions(object)
    expect(first.versionId).toBe('v-current')
    expect(first.wasCurrentAtArchive).toBe(true)
  })

  it('follows it with the retained noncurrent versions, newest first', () => {
    expect(getMergedArchivedVersions(object).map((v) => v.versionId)).toEqual([
      'v-current',
      'v-2',
      'v-1',
    ])
  })

  it('flags only the first row as having been current', () => {
    const rows = getMergedArchivedVersions(object)
    expect(rows.filter((v) => v.wasCurrentAtArchive)).toHaveLength(1)
  })

  it('preserves each version’s own size and action rather than inventing them', () => {
    const rows = getMergedArchivedVersions(object)
    expect(rows.map((v) => v.size)).toEqual([900, 800, 700])
    expect(rows.map((v) => v.action)).toEqual(['overwrite', 'overwrite', 'initial upload'])
  })

  it('returns just the archived version when nothing else was retained', () => {
    const rows = getMergedArchivedVersions({ ...object, noncurrentVersions: [] })
    expect(rows).toHaveLength(1)
    expect(rows[0].wasCurrentAtArchive).toBe(true)
  })
})
