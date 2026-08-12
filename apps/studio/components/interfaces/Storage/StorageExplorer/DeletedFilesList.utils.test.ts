import { describe, expect, it } from 'vitest'

import type { TrashObject } from '@/data/storage/protection/protection-mocks'

import {
  getMergedArchivedVersions,
  parseVersionKey,
  splitDeletedSelection,
  versionKey,
} from './DeletedFilesList.utils'

const buildObject = (overrides: Partial<TrashObject> = {}): TrashObject => ({
  id: 'trash-1',
  name: 'final.png',
  originalPath: 'matches/round-3/',
  deletedAt: '2026-07-24T07:20:00.000Z',
  deletedBy: 'jane@acme.co',
  size: 1_100_000,
  expiresAt: null,
  ...overrides,
})

describe('getMergedArchivedVersions', () => {
  it('leads with the version that was live at archive time, tagged accordingly', () => {
    const object = buildObject({
      noncurrentVersions: [
        { versionId: 'v-a', size: 1_050_000, createdAt: '2026-07-22T14:00:00.000Z', action: 'overwrite' },
        { versionId: 'v-b', size: 980_000, createdAt: '2026-07-19T11:00:00.000Z', action: 'initial upload' },
      ],
    })

    expect(getMergedArchivedVersions(object)).toEqual([
      {
        versionId: 'trash-1',
        size: 1_100_000,
        createdAt: '2026-07-24T07:20:00.000Z',
        action: 'overwrite',
        wasCurrentAtArchive: true,
      },
      {
        versionId: 'v-a',
        size: 1_050_000,
        createdAt: '2026-07-22T14:00:00.000Z',
        action: 'overwrite',
        wasCurrentAtArchive: false,
      },
      {
        versionId: 'v-b',
        size: 980_000,
        createdAt: '2026-07-19T11:00:00.000Z',
        action: 'initial upload',
        wasCurrentAtArchive: false,
      },
    ])
  })

  it('still returns the current-at-archive row when there are no noncurrent versions', () => {
    const object = buildObject()
    expect(getMergedArchivedVersions(object)).toEqual([
      {
        versionId: 'trash-1',
        size: 1_100_000,
        createdAt: '2026-07-24T07:20:00.000Z',
        action: 'overwrite',
        wasCurrentAtArchive: true,
      },
    ])
  })
})

describe('versionKey / parseVersionKey', () => {
  it('round-trips an object id and version id', () => {
    expect(parseVersionKey(versionKey('trash-1', 'v-a'))).toEqual({
      objectId: 'trash-1',
      versionId: 'v-a',
    })
  })

  it('returns null for a key with no separator', () => {
    expect(parseVersionKey('trash-1')).toBeNull()
  })
})

describe('splitDeletedSelection', () => {
  it('separates top-level object ids from version keys', () => {
    expect(splitDeletedSelection(['trash-1', versionKey('trash-2', 'v-a')])).toEqual({
      objectIds: ['trash-1'],
      versions: [{ objectId: 'trash-2', versionId: 'v-a' }],
    })
  })

  it('drops a version entry when its parent object id is also selected', () => {
    expect(
      splitDeletedSelection(['trash-1', versionKey('trash-1', 'v-a'), versionKey('trash-1', 'v-b')])
    ).toEqual({
      objectIds: ['trash-1'],
      versions: [],
    })
  })

  it('keeps version entries whose parent is not selected', () => {
    expect(splitDeletedSelection([versionKey('trash-1', 'v-a'), versionKey('trash-2', 'v-b')])).toEqual(
      {
        objectIds: [],
        versions: [
          { objectId: 'trash-1', versionId: 'v-a' },
          { objectId: 'trash-2', versionId: 'v-b' },
        ],
      }
    )
  })
})
