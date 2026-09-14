import { describe, expect, it } from 'vitest'

import { MAX_ITEMS_PER_MOVE, STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItem, StorageItemWithColumn } from '../Storage.types'
import {
  canMoveItemsTo,
  canMoveItemTo,
  getColumnPath,
  getFolderObjectMoves,
  getItemPath,
  getItemsToDrag,
  getParentPath,
  isWithinMoveLimit,
  joinPaths,
  toMoveCandidates,
} from './FileExplorerDnd.utils'

const createItem = (
  name: string,
  type: STORAGE_ROW_TYPES,
  columnIndex: number
): StorageItemWithColumn => ({
  id: `${name}-id`,
  name,
  type,
  status: STORAGE_ROW_STATUS.READY,
  metadata: null,
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  isCorrupted: false,
  columnIndex,
})

const createFolder = (name: string): StorageItem => createItem(name, STORAGE_ROW_TYPES.FOLDER, 0)

describe('joinPaths', () => {
  it('joins segments with a slash', () => {
    expect(joinPaths('photos', 'holiday', 'beach.png')).toBe('photos/holiday/beach.png')
  })

  it('drops empty segments so the bucket root stays an empty string', () => {
    expect(joinPaths('', 'beach.png')).toBe('beach.png')
    expect(joinPaths('', '')).toBe('')
  })
})

describe('getParentPath', () => {
  it('returns the directory a path sits in', () => {
    expect(getParentPath('photos/holiday/beach.png')).toBe('photos/holiday')
  })

  it('returns the bucket root for a top level item', () => {
    expect(getParentPath('beach.png')).toBe('')
  })
})

describe('getColumnPath', () => {
  const openedFolders = [createFolder('photos'), createFolder('holiday')]

  it('returns the bucket root for the first column', () => {
    expect(getColumnPath(openedFolders, 0)).toBe('')
  })

  it('returns the folders opened up to that column', () => {
    expect(getColumnPath(openedFolders, 1)).toBe('photos')
    expect(getColumnPath(openedFolders, 2)).toBe('photos/holiday')
  })
})

describe('getItemPath', () => {
  it('prefixes the item with the folders opened before its column', () => {
    const openedFolders = [createFolder('photos')]
    const item = createItem('beach.png', STORAGE_ROW_TYPES.FILE, 1)

    expect(getItemPath(openedFolders, item)).toBe('photos/beach.png')
  })

  it('returns just the name for items at the bucket root', () => {
    expect(getItemPath([], createItem('beach.png', STORAGE_ROW_TYPES.FILE, 0))).toBe('beach.png')
  })
})

describe('canMoveItemTo', () => {
  it('allows a file to move into another folder', () => {
    expect(canMoveItemTo({ path: 'photos/beach.png', isFolder: false }, 'archive')).toBe(true)
  })

  it('rejects a move into the folder the item is already in', () => {
    expect(canMoveItemTo({ path: 'photos/beach.png', isFolder: false }, 'photos')).toBe(false)
    expect(canMoveItemTo({ path: 'beach.png', isFolder: false }, '')).toBe(false)
  })

  it('rejects dropping a folder onto itself', () => {
    expect(canMoveItemTo({ path: 'photos/holiday', isFolder: true }, 'photos/holiday')).toBe(false)
  })

  it('rejects dropping a folder into one of its own descendants', () => {
    expect(canMoveItemTo({ path: 'photos', isFolder: true }, 'photos/holiday/beach')).toBe(false)
  })

  it('allows a folder to move into a sibling with a similar name', () => {
    expect(canMoveItemTo({ path: 'photos', isFolder: true }, 'photos-archive')).toBe(true)
  })

  it('allows a folder to move up to the bucket root', () => {
    expect(canMoveItemTo({ path: 'photos/holiday', isFolder: true }, '')).toBe(true)
  })
})

describe('canMoveItemsTo', () => {
  it('rejects an empty selection', () => {
    expect(canMoveItemsTo([], 'archive')).toBe(false)
  })

  it('rejects the whole selection when a single item is invalid', () => {
    const items = [
      { path: 'photos/beach.png', isFolder: false },
      { path: 'archive', isFolder: true },
    ]

    expect(canMoveItemsTo(items, 'archive')).toBe(false)
  })

  it('accepts a selection where every item can move', () => {
    const items = [
      { path: 'photos/beach.png', isFolder: false },
      { path: 'photos/sunset.png', isFolder: false },
    ]

    expect(canMoveItemsTo(items, 'archive')).toBe(true)
  })
})

describe('toMoveCandidates', () => {
  it('resolves paths and flags folders', () => {
    const openedFolders = [createFolder('photos')]
    const items = [
      createItem('beach.png', STORAGE_ROW_TYPES.FILE, 1),
      createItem('holiday', STORAGE_ROW_TYPES.FOLDER, 1),
    ]

    expect(toMoveCandidates(openedFolders, items)).toEqual([
      { path: 'photos/beach.png', isFolder: false },
      { path: 'photos/holiday', isFolder: true },
    ])
  })
})

describe('getItemsToDrag', () => {
  const beach = createItem('beach.png', STORAGE_ROW_TYPES.FILE, 0)
  const sunset = createItem('sunset.png', STORAGE_ROW_TYPES.FILE, 0)

  it('drags only the grabbed row when nothing else is selected', () => {
    expect(getItemsToDrag([], beach, [])).toEqual([beach])
    expect(getItemsToDrag([], beach, [beach])).toEqual([beach])
  })

  it('drags the whole selection when the grabbed row is part of it', () => {
    expect(getItemsToDrag([], beach, [beach, sunset])).toEqual([beach, sunset])
  })

  it('drags only the grabbed row when it sits outside the selection', () => {
    const outside = createItem('outside.png', STORAGE_ROW_TYPES.FILE, 0)

    expect(getItemsToDrag([], outside, [beach, sunset])).toEqual([outside])
  })

  it('does not treat every folder as selected when one folder is in the selection', () => {
    // Folders carry a null id, so an id comparison would match both of these
    const selectedFolder = { ...createItem('archive', STORAGE_ROW_TYPES.FOLDER, 0), id: null }
    const otherFolder = { ...createItem('photos', STORAGE_ROW_TYPES.FOLDER, 0), id: null }

    expect(getItemsToDrag([], otherFolder, [selectedFolder, beach])).toEqual([otherFolder])
    expect(getItemsToDrag([], selectedFolder, [selectedFolder, beach])).toEqual([
      selectedFolder,
      beach,
    ])
  })
})

describe('isWithinMoveLimit', () => {
  it('accepts a batch at the limit', () => {
    expect(isWithinMoveLimit(MAX_ITEMS_PER_MOVE)).toBe(true)
  })

  it('rejects a batch over the limit', () => {
    expect(isWithinMoveLimit(MAX_ITEMS_PER_MOVE + 1)).toBe(false)
  })
})

describe('getFolderObjectMoves', () => {
  it('keeps the structure beneath the folder intact', () => {
    const moves = getFolderObjectMoves({
      folderPath: 'photos/holiday',
      destinationPath: 'archive',
      objects: [
        { prefix: 'photos/holiday', name: 'beach.png' },
        { prefix: 'photos/holiday/raw', name: 'beach.raw' },
      ],
    })

    expect(moves).toEqual([
      { from: 'photos/holiday/beach.png', to: 'archive/holiday/beach.png' },
      { from: 'photos/holiday/raw/beach.raw', to: 'archive/holiday/raw/beach.raw' },
    ])
  })

  it('moves a folder to the bucket root without a leading slash', () => {
    const moves = getFolderObjectMoves({
      folderPath: 'photos/holiday',
      destinationPath: '',
      objects: [{ prefix: 'photos/holiday', name: 'beach.png' }],
    })

    expect(moves).toEqual([{ from: 'photos/holiday/beach.png', to: 'holiday/beach.png' }])
  })

  it('returns nothing for an empty folder', () => {
    const moves = getFolderObjectMoves({
      folderPath: 'photos',
      destinationPath: 'archive',
      objects: [],
    })

    expect(moves).toEqual([])
  })
})
