import { describe, expect, it } from 'vitest'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageColumn, StorageItem } from '../Storage.types'
import {
  clampIndex,
  getEntryItemIndex,
  getExplorerRowId,
  isItemReady,
  isReadyFile,
  isReadyFolder,
  resolveCursor,
} from './FileExplorerKeyboardNavigation.utils'

const makeItem = (
  name: string,
  type = STORAGE_ROW_TYPES.FILE,
  status = STORAGE_ROW_STATUS.READY
): StorageItem => ({
  id: type === STORAGE_ROW_TYPES.FOLDER ? null : `id-${name}`,
  name,
  type,
  status,
  metadata: null,
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  isCorrupted: false,
})

const makeColumn = (name: string, items: StorageItem[] = []): StorageColumn => ({
  id: name,
  name,
  path: '',
  status: STORAGE_ROW_STATUS.READY,
  items,
})

describe('getExplorerRowId', () => {
  it('is unique per column and row', () => {
    expect(getExplorerRowId(1, 2)).not.toBe(getExplorerRowId(2, 1))
  })
})

describe('clampIndex', () => {
  it('keeps an index inside the list', () => {
    expect(clampIndex(-1, 3)).toBe(0)
    expect(clampIndex(5, 3)).toBe(2)
    expect(clampIndex(1, 3)).toBe(1)
  })

  it('treats an empty list as index 0', () => {
    expect(clampIndex(4, 0)).toBe(0)
  })
})

describe('resolveCursor', () => {
  const columns = [
    makeColumn('my-bucket', [makeItem('images', STORAGE_ROW_TYPES.FOLDER), makeItem('a.png')]),
    makeColumn('images', [makeItem('b.png'), makeItem('c.png'), makeItem('d.png')]),
  ]

  it('leaves a cursor that points at a row alone', () => {
    expect(resolveCursor({ columnIndex: 1, itemIndex: 2 }, columns, { isListView: false })).toEqual(
      {
        columnIndex: 1,
        itemIndex: 2,
      }
    )
  })

  it('pulls the cursor back when its column is collapsed away', () => {
    expect(resolveCursor({ columnIndex: 4, itemIndex: 1 }, columns, { isListView: false })).toEqual(
      { columnIndex: 1, itemIndex: 1 }
    )
  })

  it('pulls the cursor back when its row is gone after a refresh', () => {
    expect(resolveCursor({ columnIndex: 0, itemIndex: 9 }, columns, { isListView: false })).toEqual(
      { columnIndex: 0, itemIndex: 1 }
    )
  })

  it('sits in the deepest column in list view, which is the only one on screen', () => {
    expect(resolveCursor({ columnIndex: 0, itemIndex: 0 }, columns, { isListView: true })).toEqual({
      columnIndex: 1,
      itemIndex: 0,
    })
  })

  it('falls back to the first row when there are no columns yet', () => {
    expect(resolveCursor({ columnIndex: 3, itemIndex: 3 }, [], { isListView: false })).toEqual({
      columnIndex: 0,
      itemIndex: 0,
    })
  })
})

describe('getEntryItemIndex', () => {
  const column = makeColumn('my-bucket', [
    makeItem('a.png'),
    makeItem('images', STORAGE_ROW_TYPES.FOLDER),
  ])

  it('lands on the folder that is currently open below the column', () => {
    expect(getEntryItemIndex(column, 'images')).toBe(1)
  })

  it('lands on the first row when nothing below the column is open', () => {
    expect(getEntryItemIndex(column, undefined)).toBe(0)
  })

  it('lands on the first row when the open folder is no longer listed', () => {
    expect(getEntryItemIndex(column, 'archive')).toBe(0)
  })

  it('handles a column that does not exist', () => {
    expect(getEntryItemIndex(undefined, 'images')).toBe(0)
  })
})

describe('item guards', () => {
  it('rejects a row that is still uploading', () => {
    const uploading = makeItem('a.png', STORAGE_ROW_TYPES.FILE, STORAGE_ROW_STATUS.LOADING)
    expect(isItemReady(uploading)).toBe(false)
    expect(isReadyFile(uploading)).toBe(false)
  })

  it('rejects a missing row', () => {
    expect(isItemReady(undefined)).toBe(false)
    expect(isReadyFolder(undefined)).toBe(false)
  })

  it('tells folders and files apart', () => {
    expect(isReadyFolder(makeItem('images', STORAGE_ROW_TYPES.FOLDER))).toBe(true)
    expect(isReadyFile(makeItem('images', STORAGE_ROW_TYPES.FOLDER))).toBe(false)
    expect(isReadyFile(makeItem('a.png'))).toBe(true)
    expect(isReadyFolder(makeItem('a.png'))).toBe(false)
  })
})
