import { describe, expect, it } from 'vitest'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItem, StorageItemWithColumn } from '../Storage.types'
import {
  BREADCRUMB_ITEMS_TO_DISPLAY,
  filterFoldersBySearch,
  getDestinationLabel,
  getDestinationName,
  getMoveBreadcrumbs,
  getMoveItemsTitle,
  getParentPathLabel,
  getSourcePaths,
  isSameAsSourcePath,
  MAX_FOLDER_SEARCH_RESULTS,
  toFolders,
} from './MoveItemsModal.utils'

const createItem = (name: string, type = STORAGE_ROW_TYPES.FILE): StorageItem => ({
  id: name,
  name,
  type,
  status: STORAGE_ROW_STATUS.READY,
  metadata: null,
  created_at: null,
  updated_at: null,
  last_accessed_at: null,
  isCorrupted: false,
})

const createItemWithColumn = (name: string, columnIndex: number): StorageItemWithColumn => ({
  ...createItem(name),
  columnIndex,
})

const createFolder = (path: string) => ({ name: path.split('/').pop()!, path })

describe('getSourcePaths', () => {
  const openedFolders = [
    createItem('photos', STORAGE_ROW_TYPES.FOLDER),
    createItem('2024', STORAGE_ROW_TYPES.FOLDER),
  ]

  it('returns the root for items in the first column', () => {
    expect(getSourcePaths([createItemWithColumn('a.png', 0)], openedFolders)).toEqual([''])
  })

  it('joins the folders opened to reach the item', () => {
    expect(getSourcePaths([createItemWithColumn('a.png', 2)], openedFolders)).toEqual([
      'photos/2024',
    ])
  })

  it('deduplicates items that share a source folder', () => {
    const items = [createItemWithColumn('a.png', 1), createItemWithColumn('b.png', 1)]
    expect(getSourcePaths(items, openedFolders)).toEqual(['photos'])
  })

  it('returns every distinct source when items span columns', () => {
    const items = [createItemWithColumn('a.png', 1), createItemWithColumn('b.png', 2)]
    expect(getSourcePaths(items, openedFolders)).toEqual(['photos', 'photos/2024'])
  })
})

describe('isSameAsSourcePath', () => {
  it('is true when the only source folder is the destination', () => {
    expect(isSameAsSourcePath(['photos'], 'photos')).toBe(true)
    expect(isSameAsSourcePath([''], '')).toBe(true)
  })

  it('is false when the destination is a different folder', () => {
    expect(isSameAsSourcePath(['photos'], 'photos/2024')).toBe(false)
    expect(isSameAsSourcePath([''], 'photos')).toBe(false)
  })

  it('is false when items come from more than one folder', () => {
    expect(isSameAsSourcePath(['photos', 'photos/2024'], 'photos')).toBe(false)
  })
})

describe('getDestinationName', () => {
  it('falls back to the bucket name at the root', () => {
    expect(getDestinationName('avatars', [])).toBe('avatars')
  })

  it('uses the deepest folder', () => {
    expect(getDestinationName('avatars', ['photos', '2024'])).toBe('2024')
  })
})

describe('getDestinationLabel', () => {
  it('prefixes the path with the bucket', () => {
    expect(getDestinationLabel('avatars', ['photos', '2024'])).toBe('avatars/photos/2024')
    expect(getDestinationLabel('avatars', [])).toBe('avatars')
  })
})

describe('filterFoldersBySearch', () => {
  const folders = [
    createFolder('archive/photos'),
    createFolder('photos'),
    createFolder('photos-2024'),
    createFolder('screenshots'),
    createFolder('videos'),
  ]

  it('returns nothing for an empty search', () => {
    expect(filterFoldersBySearch(folders, '   ')).toEqual([])
  })

  it('matches names case insensitively', () => {
    expect(filterFoldersBySearch(folders, 'PHOTOS').map((folder) => folder.path)).toEqual([
      'archive/photos',
      'photos',
      'photos-2024',
    ])
  })

  it('ranks exact names first, then prefixes, then substrings', () => {
    expect(filterFoldersBySearch(folders, 'photos').map((folder) => folder.path)).toEqual([
      'archive/photos',
      'photos',
      'photos-2024',
    ])
  })

  it('matches on the folder path when the name does not match', () => {
    expect(filterFoldersBySearch(folders, 'archive').map((folder) => folder.path)).toEqual([
      'archive/photos',
    ])
  })

  it('returns nothing when no folder matches', () => {
    expect(filterFoldersBySearch(folders, 'invoices')).toEqual([])
  })

  it('caps the number of results', () => {
    const many = Array.from({ length: MAX_FOLDER_SEARCH_RESULTS + 10 }, (_, index) =>
      createFolder(`photos-${index}`)
    )
    expect(filterFoldersBySearch(many, 'photos')).toHaveLength(MAX_FOLDER_SEARCH_RESULTS)
  })
})

describe('toFolders', () => {
  // Objects without an id are prefixes (folders); the rest are files
  const objects = [
    { id: null, name: 'photos' },
    { id: 'id-a', name: 'a.png' },
    { id: null, name: 'videos' },
  ] as Parameters<typeof toFolders>[0]

  it('drops files and keeps folders in order', () => {
    expect(toFolders(objects, '').map((folder) => folder.name)).toEqual(['photos', 'videos'])
  })

  it('builds paths relative to the bucket root', () => {
    expect(toFolders(objects, '').map((folder) => folder.path)).toEqual(['photos', 'videos'])
  })

  it('prefixes paths with the parent folder', () => {
    expect(toFolders(objects, 'archive/2024').map((folder) => folder.path)).toEqual([
      'archive/2024/photos',
      'archive/2024/videos',
    ])
  })

  it('returns nothing for a folder of only files', () => {
    expect(toFolders([{ id: 'id-a', name: 'a.png' }] as typeof objects, '')).toEqual([])
  })
})

describe('getParentPathLabel', () => {
  it('falls back to the bucket name for a top level folder', () => {
    expect(getParentPathLabel('photos', 'avatars')).toBe('avatars')
  })

  it('joins the parent segments for a nested folder', () => {
    expect(getParentPathLabel('archive/2024/photos', 'avatars')).toBe('archive/2024')
  })
})

describe('getMoveBreadcrumbs', () => {
  const labels = (crumbs: { label: string }[]) => crumbs.map((crumb) => crumb.label)

  it('shows only the bucket at the root, marked as current', () => {
    const { first, collapsed, tail } = getMoveBreadcrumbs('avatars', [])
    expect(first).toEqual({ label: 'avatars', pathSegments: [], isCurrent: true })
    expect(collapsed).toEqual([])
    expect(tail).toEqual([])
  })

  it('keeps every crumb visible up to the display limit', () => {
    const { first, collapsed, tail } = getMoveBreadcrumbs('avatars', ['a', 'b'])
    expect(first.label).toBe('avatars')
    expect(collapsed).toEqual([])
    expect(labels(tail)).toEqual(['a', 'b'])
  })

  it('collapses the middle once the path exceeds the display limit', () => {
    const { first, collapsed, tail } = getMoveBreadcrumbs('avatars', ['a', 'b', 'c'])
    expect(first.label).toBe('avatars')
    expect(labels(collapsed)).toEqual(['a'])
    expect(labels(tail)).toEqual(['b', 'c'])
  })

  it('collapses everything between the bucket and the last two folders', () => {
    const { first, collapsed, tail } = getMoveBreadcrumbs('avatars', ['a', 'b', 'c', 'd', 'e'])
    expect(first.label).toBe('avatars')
    expect(labels(collapsed)).toEqual(['a', 'b', 'c'])
    expect(labels(tail)).toEqual(['d', 'e'])
  })

  it('never renders more than the display limit of visible crumbs', () => {
    const deep = Array.from({ length: 20 }, (_, index) => `folder-${index}`)
    const { collapsed, tail } = getMoveBreadcrumbs('avatars', deep)
    expect(1 + tail.length).toBe(BREADCRUMB_ITEMS_TO_DISPLAY)
    expect(collapsed).toHaveLength(deep.length - tail.length)
  })

  it('points each crumb at the path it should navigate to', () => {
    const { first, collapsed, tail } = getMoveBreadcrumbs('avatars', ['a', 'b', 'c', 'd'])
    expect(first.pathSegments).toEqual([])
    expect(collapsed.map((crumb) => crumb.pathSegments)).toEqual([['a'], ['a', 'b']])
    expect(tail.map((crumb) => crumb.pathSegments)).toEqual([
      ['a', 'b', 'c'],
      ['a', 'b', 'c', 'd'],
    ])
  })

  it('marks only the deepest folder as current', () => {
    const { first, collapsed, tail } = getMoveBreadcrumbs('avatars', ['a', 'b', 'c', 'd'])
    expect(first.isCurrent).toBe(false)
    expect(collapsed.some((crumb) => crumb.isCurrent)).toBe(false)
    expect(tail.map((crumb) => crumb.isCurrent)).toEqual([false, true])
  })
})

describe('getMoveItemsTitle', () => {
  it('names the file when moving one item', () => {
    expect(getMoveItemsTitle([createItemWithColumn('avatar.png', 0)])).toBe('Move avatar.png')
  })

  it('counts the items when moving several', () => {
    const items = [createItemWithColumn('a.png', 0), createItemWithColumn('b.png', 0)]
    expect(getMoveItemsTitle(items)).toBe('Move 2 items')
  })
})
