import { describe, expect, it } from 'vitest'

import { STORAGE_ROW_TYPES } from '../Storage.constants'
import type { TrashObject } from '@/data/storage/protection/protection-mocks'

import { getArchivedOverlayItems, getArchivedSegments } from './archivedOverlay.utils'

const trash = (overrides: Partial<TrashObject> & Pick<TrashObject, 'id' | 'name' | 'originalPath'>): TrashObject => ({
  deletedAt: '2026-07-24T07:20:00.000Z',
  deletedBy: 'jane@acme.co',
  size: 1024,
  expiresAt: null,
  ...overrides,
})

describe('getArchivedSegments', () => {
  it('normalizes originalPath + basename(name) with tolerance for the mock inconsistency', () => {
    // originalPath already contains the leading folder segments; name here
    // redundantly re-includes the leaf folder, mirroring the mock data.
    expect(
      getArchivedSegments(
        trash({ id: 'a', originalPath: 'matches/round-3/', name: 'round-3/final.png' })
      )
    ).toEqual(['matches', 'round-3', 'final.png'])

    expect(getArchivedSegments(trash({ id: 'b', originalPath: 'exports/', name: 'roster.csv' }))).toEqual([
      'exports',
      'roster.csv',
    ])

    expect(getArchivedSegments(trash({ id: 'c', originalPath: '', name: 'root.txt' }))).toEqual([
      'root.txt',
    ])
  })
})

describe('getArchivedOverlayItems', () => {
  const objects: TrashObject[] = [
    trash({ id: 'a', originalPath: 'matches/round-3/', name: 'round-3/final.png' }),
    trash({ id: 'b', originalPath: 'matches/round-3/', name: 'notes.md' }),
    trash({ id: 'c', originalPath: 'matches/round-2/thumbnails/', name: 'preview.webp' }),
    trash({ id: 'd', originalPath: 'exports/', name: 'roster.csv' }),
    trash({ id: 'e', originalPath: '', name: 'root.txt' }),
  ]

  it('at the root, surfaces top-level folders once + direct files', () => {
    const result = getArchivedOverlayItems({
      folderSegments: [],
      trashObjects: objects,
      existingItemNames: new Set(),
    })
    // "matches" folder is coalesced from three descendant objects.
    const names = result.map((r) => `${r.type}:${r.name}`).sort()
    expect(names).toEqual([
      'FILE:root.txt',
      'FOLDER:exports',
      'FOLDER:matches',
    ])
  })

  it('drills into a folder and returns only its descendants', () => {
    const result = getArchivedOverlayItems({
      folderSegments: ['matches'],
      trashObjects: objects,
      existingItemNames: new Set(),
    })
    expect(result.map((r) => `${r.type}:${r.name}`).sort()).toEqual([
      'FOLDER:round-2',
      'FOLDER:round-3',
    ])
  })

  it('emits direct children as files with a trashObjectId + archived marker', () => {
    const result = getArchivedOverlayItems({
      folderSegments: ['matches', 'round-3'],
      trashObjects: objects,
      existingItemNames: new Set(),
    })
    expect(result).toHaveLength(2)
    const files = result.filter((r) => r.type === STORAGE_ROW_TYPES.FILE)
    expect(files.map((f) => f.name).sort()).toEqual(['final.png', 'notes.md'])
    files.forEach((file) => {
      expect(file.archived?.trashObjectId).toBeDefined()
    })
  })

  it('skips an archived stand-in when a live item of the same name is already listed', () => {
    // A live file called "roster.csv" already lives in "exports/" — the
    // archived one shouldn't produce a duplicate row here.
    const result = getArchivedOverlayItems({
      folderSegments: ['exports'],
      trashObjects: objects,
      existingItemNames: new Set(['roster.csv']),
    })
    expect(result).toHaveLength(0)
  })

  it('skips an archived folder stand-in when a live folder of the same name exists at this level', () => {
    const result = getArchivedOverlayItems({
      folderSegments: [],
      trashObjects: objects,
      existingItemNames: new Set(['matches']),
    })
    // Only exports (folder) + root.txt (file) remain — "matches" is now
    // represented by the live folder from the bucket listing.
    expect(result.map((r) => `${r.type}:${r.name}`).sort()).toEqual([
      'FILE:root.txt',
      'FOLDER:exports',
    ])
  })

  it('marks synthesized folder rows as archived', () => {
    const [folder] = getArchivedOverlayItems({
      folderSegments: [],
      trashObjects: [trash({ id: 'a', originalPath: 'gone/', name: 'file.png' })],
      existingItemNames: new Set(),
    })
    expect(folder.type).toBe(STORAGE_ROW_TYPES.FOLDER)
    expect(folder.archived).toBeDefined()
    expect(folder.archived?.trashObjectId).toBeUndefined()
  })
})
