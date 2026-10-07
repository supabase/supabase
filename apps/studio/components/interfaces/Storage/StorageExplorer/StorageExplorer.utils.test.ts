import { toast } from 'sonner'
import { copyToClipboard } from 'ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import type { StorageItem } from '@/components/interfaces/Storage/Storage.types'
import {
  copyStorageExplorerUrl,
  copyStoragePath,
  getPathAlongFoldersToIndex,
  getPathAlongOpenedFolders,
  getStorageExplorerUrlForItem,
  getStoragePathForItem,
  parseStoragePath,
  sanitizeNameForDuplicateInColumn,
  serializeStoragePath,
  validateFolderName,
} from '@/components/interfaces/Storage/StorageExplorer/StorageExplorer.utils'

function makeBucket(name: string) {
  return {
    id: name,
    name,
    owner: 'owner',
    public: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
}

function makeFolder(name: string): StorageItem {
  return {
    id: null,
    name,
    type: STORAGE_ROW_TYPES.FOLDER,
    status: STORAGE_ROW_STATUS.READY,
    metadata: null,
    isCorrupted: false,
    created_at: null,
    updated_at: null,
    last_accessed_at: null,
  }
}

describe('validateFolderName', () => {
  describe('valid names', () => {
    it('accepts plain alphanumeric names', () => {
      expect(validateFolderName('myfolder')).toBeNull()
      expect(validateFolderName('MyFolder123')).toBeNull()
    })

    it('accepts names with underscores and hyphens', () => {
      expect(validateFolderName('my_folder')).toBeNull()
      expect(validateFolderName('my-folder')).toBeNull()
    })

    it('accepts names with dots', () => {
      expect(validateFolderName('my.folder')).toBeNull()
    })

    it('accepts names with spaces', () => {
      expect(validateFolderName('my folder')).toBeNull()
    })

    it('accepts names with allowed special characters', () => {
      expect(validateFolderName('folder!')).toBeNull()
      expect(validateFolderName("folder'")).toBeNull()
      expect(validateFolderName('folder(1)')).toBeNull()
      expect(validateFolderName('folder*')).toBeNull()
      expect(validateFolderName('folder&name')).toBeNull()
      expect(validateFolderName('folder$name')).toBeNull()
      expect(validateFolderName('folder@name')).toBeNull()
      expect(validateFolderName('folder=name')).toBeNull()
      expect(validateFolderName('folder;name')).toBeNull()
      expect(validateFolderName('folder:name')).toBeNull()
      expect(validateFolderName('folder+name')).toBeNull()
      expect(validateFolderName('folder,name')).toBeNull()
      expect(validateFolderName('folder?name')).toBeNull()
    })

    it('accepts names with forward slashes', () => {
      expect(validateFolderName('parent/child')).toBeNull()
    })

    it('accepts an empty string', () => {
      expect(validateFolderName('')).toBeNull()
    })
  })

  describe('invalid names', () => {
    it('rejects a name containing #', () => {
      const result = validateFolderName('my#folder')
      expect(result).toBe('Folder name cannot contain the "#" character')
    })

    it('rejects a name containing %', () => {
      const result = validateFolderName('my%folder')
      expect(result).toBe('Folder name cannot contain the "%" character')
    })

    it('rejects a name containing ^', () => {
      const result = validateFolderName('my^folder')
      expect(result).toBe('Folder name cannot contain the "^" character')
    })

    it('rejects a name containing [', () => {
      const result = validateFolderName('my[folder')
      expect(result).toBe('Folder name cannot contain the "[" character')
    })
  })
})

describe('getPathAlongOpenedFolders', () => {
  const selectedBucket = makeBucket('my-bucket')

  it('returns only the bucket name when there are no opened folders and includeBucket=true', () => {
    expect(getPathAlongOpenedFolders({ openedFolders: [], selectedBucket })).toBe('my-bucket')
  })

  it('returns bucket/folder when one folder is open and includeBucket=true', () => {
    expect(
      getPathAlongOpenedFolders({ openedFolders: [makeFolder('images')], selectedBucket })
    ).toBe('my-bucket/images')
  })

  it('returns the full path when multiple folders are open and includeBucket=true', () => {
    const openedFolders = [makeFolder('images'), makeFolder('2024'), makeFolder('january')]
    expect(getPathAlongOpenedFolders({ openedFolders, selectedBucket })).toBe(
      'my-bucket/images/2024/january'
    )
  })

  it('returns an empty string when there are no opened folders and includeBucket=false', () => {
    expect(getPathAlongOpenedFolders({ openedFolders: [], selectedBucket }, false)).toBe('')
  })

  it('returns the folder path without the bucket when includeBucket=false', () => {
    const openedFolders = [makeFolder('images'), makeFolder('2024')]
    expect(getPathAlongOpenedFolders({ openedFolders, selectedBucket }, false)).toBe('images/2024')
  })
})

describe('getPathAlongFoldersToIndex', () => {
  const openedFolders = [makeFolder('images'), makeFolder('2024'), makeFolder('january')]

  it('returns an empty string for index 0', () => {
    expect(getPathAlongFoldersToIndex({ openedFolders }, 0)).toBe('')
  })

  it('returns the first folder name for index 1', () => {
    expect(getPathAlongFoldersToIndex({ openedFolders }, 1)).toBe('images')
  })

  it('returns folders joined up to (not including) the given index', () => {
    expect(getPathAlongFoldersToIndex({ openedFolders }, 2)).toBe('images/2024')
    expect(getPathAlongFoldersToIndex({ openedFolders }, 3)).toBe('images/2024/january')
  })

  it('returns an empty string for an empty openedFolders array', () => {
    expect(getPathAlongFoldersToIndex({ openedFolders: [] }, 5)).toBe('')
  })
})

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('ui', () => ({ copyToClipboard: vi.fn() }))

describe('sanitizeNameForDuplicateInColumn', () => {
  // Reset mock call counts between tests
  beforeEach(() => vi.mocked(toast.error).mockClear())

  // Build a state with one column per array of item overrides.
  // e.g. makeState([['a.txt'], ['b.txt', 'c.txt']]) → two columns
  function makeState(columns: Array<Array<Partial<StorageItem>>>) {
    return {
      columns: columns.map((columnItems, i) => ({
        id: null,
        name: `col-${i}`,
        path: `col-${i}`,
        status: STORAGE_ROW_STATUS.READY,
        items: columnItems.map((overrides) => ({
          id: 'file-id',
          name: 'file.txt',
          type: STORAGE_ROW_TYPES.FILE,
          status: STORAGE_ROW_STATUS.READY,
          metadata: null,
          isCorrupted: false,
          created_at: null,
          updated_at: null,
          last_accessed_at: null,
          ...overrides,
        })),
      })),
    }
  }

  it('returns the original name when there is no conflict', () => {
    const state = makeState([[{ name: 'other.txt' }]])
    expect(sanitizeNameForDuplicateInColumn(state, { name: 'file.txt' })).toBe('file.txt')
  })

  it('is case-insensitive when detecting duplicates', () => {
    const state = makeState([[{ name: 'FILE.TXT' }]])
    expect(sanitizeNameForDuplicateInColumn(state, { name: 'file.txt' })).toBeNull()
    expect(toast.error).toHaveBeenCalled()
  })

  it('skips items that are currently being edited', () => {
    const state = makeState([[{ name: 'file.txt', status: STORAGE_ROW_STATUS.EDITING }]])
    expect(sanitizeNameForDuplicateInColumn(state, { name: 'file.txt' })).toBe('file.txt')
  })

  describe('columnIndex', () => {
    // Two-column state: col 0 has 'file.txt', col 1 has 'other.txt'
    const state = makeState([[{ name: 'file.txt' }], [{ name: 'other.txt' }]])

    it('defaults to the last column when columnIndex is omitted', () => {
      // col 1 has 'other.txt', not 'file.txt' → no conflict
      expect(sanitizeNameForDuplicateInColumn(state, { name: 'file.txt' })).toBe('file.txt')
    })

    it('uses the explicitly provided columnIndex', () => {
      // col 0 has 'file.txt' → conflict
      expect(
        sanitizeNameForDuplicateInColumn(state, { name: 'file.txt', columnIndex: 0 })
      ).toBeNull()
      expect(toast.error).toHaveBeenCalled()
    })

    it('only checks the specified column, ignoring conflicts in other columns', () => {
      // col 1 has 'other.txt' but not 'file.txt' → no conflict at columnIndex 1
      expect(sanitizeNameForDuplicateInColumn(state, { name: 'file.txt', columnIndex: 1 })).toBe(
        'file.txt'
      )
    })

    it('detects a conflict in the first column when columnIndex is 0', () => {
      // col 0 has 'file.txt' → conflict
      expect(sanitizeNameForDuplicateInColumn(state, { name: 'other.txt', columnIndex: 0 })).toBe(
        'other.txt'
      ) // 'other.txt' is not in col 0
      expect(
        sanitizeNameForDuplicateInColumn(state, { name: 'file.txt', columnIndex: 0 })
      ).toBeNull()
    })
  })

  describe('autofix: false (default)', () => {
    it('shows an error toast and returns null on conflict', () => {
      const state = makeState([[{ name: 'file.txt' }]])
      const result = sanitizeNameForDuplicateInColumn(state, { name: 'file.txt', autofix: false })
      expect(result).toBeNull()
      expect(toast.error).toHaveBeenCalledWith(
        'The name file.txt already exists in the current directory. Please use a different name.'
      )
    })
  })

  describe('autofix: true', () => {
    it('appends (1) to a file name with no prior duplicates', () => {
      const state = makeState([[{ name: 'file.txt' }]])
      expect(sanitizeNameForDuplicateInColumn(state, { name: 'file.txt', autofix: true })).toBe(
        'file (1).txt'
      )
    })

    it('appends (2) when one auto-named duplicate already exists', () => {
      const state = makeState([[{ name: 'file.txt' }, { name: 'file (1).txt' }]])
      expect(sanitizeNameForDuplicateInColumn(state, { name: 'file.txt', autofix: true })).toBe(
        'file (2).txt'
      )
    })

    it('treats the whole name as the extension when there is no dot (existing behaviour)', () => {
      // NOTE: the function splits on '.' and always treats the last segment as the
      // extension, so a dotless name produces " (1).myfile" rather than "myfile (1)".
      // This is a known quirk of the implementation — not a regression.
      const state = makeState([[{ name: 'myfile' }]])
      expect(sanitizeNameForDuplicateInColumn(state, { name: 'myfile', autofix: true })).toBe(
        ' (1).myfile'
      )
    })
  })
})

describe('parseStoragePath', () => {
  it('returns an empty array for an absent or empty param', () => {
    expect(parseStoragePath(null)).toEqual([])
    expect(parseStoragePath(undefined)).toEqual([])
    expect(parseStoragePath('')).toEqual([])
  })

  it('splits a slash-joined path into segments', () => {
    expect(parseStoragePath('a/b/c')).toEqual(['a', 'b', 'c'])
  })

  it('tolerates leading, trailing and repeated slashes', () => {
    expect(parseStoragePath('/a//b/')).toEqual(['a', 'b'])
    expect(parseStoragePath('///')).toEqual([])
  })

  it('preserves spaces and unicode within a segment', () => {
    expect(parseStoragePath('my folder/ünïcode 📁/x')).toEqual(['my folder', 'ünïcode 📁', 'x'])
  })
})

describe('serializeStoragePath', () => {
  it('returns an empty string for the bucket root so clearOnDefault strips the param', () => {
    expect(serializeStoragePath([])).toBe('')
  })

  it('joins segments with a slash', () => {
    expect(serializeStoragePath(['a', 'b', 'c'])).toBe('a/b/c')
  })

  it('drops empty segments', () => {
    expect(serializeStoragePath(['a', '', 'b'])).toBe('a/b')
  })

  it('round-trips with parseStoragePath', () => {
    const segments = ['images', 'my folder', '2024']
    expect(parseStoragePath(serializeStoragePath(segments))).toEqual(segments)
  })
})

function makeFile(name: string): StorageItem {
  return { ...makeFolder(name), id: name, type: STORAGE_ROW_TYPES.FILE }
}

describe('getStoragePathForItem', () => {
  it('returns just the name at the bucket root', () => {
    expect(getStoragePathForItem([], { ...makeFile('photo.png'), columnIndex: 0 })).toBe(
      'photo.png'
    )
  })

  it('joins the opened folder chain above the item', () => {
    const openedFolders = [makeFolder('avatars'), makeFolder('2024')]
    expect(getStoragePathForItem(openedFolders, { ...makeFile('photo.png'), columnIndex: 2 })).toBe(
      'avatars/2024/photo.png'
    )
  })

  it('uses the same shape for folders', () => {
    const openedFolders = [makeFolder('avatars')]
    expect(getStoragePathForItem(openedFolders, { ...makeFolder('2024'), columnIndex: 1 })).toBe(
      'avatars/2024'
    )
  })

  it('omits the bucket name so the value works with storage.from(bucket)', () => {
    const openedFolders = [makeFolder('avatars')]
    const path = getStoragePathForItem(openedFolders, { ...makeFile('a.png'), columnIndex: 1 })
    expect(path.startsWith('my-bucket')).toBe(false)
  })
})

describe('getStorageExplorerUrlForItem', () => {
  const projectRef = 'abcdef'
  const bucketId = 'my-bucket'

  it('points a folder link at the folder itself', () => {
    const url = new URL(
      getStorageExplorerUrlForItem({
        openedFolders: [makeFolder('avatars')],
        item: { ...makeFolder('2024'), columnIndex: 1 },
        projectRef,
        bucketId,
      })
    )

    expect(url.pathname).toContain(`/project/${projectRef}/storage/files/buckets/${bucketId}`)
    expect(url.searchParams.get('path')).toBe('avatars/2024')
    expect(url.searchParams.get('preview')).toBeNull()
  })

  it('points a file link at its parent folder plus the file', () => {
    const url = new URL(
      getStorageExplorerUrlForItem({
        openedFolders: [makeFolder('avatars'), makeFolder('2024')],
        item: { ...makeFile('photo.png'), columnIndex: 2 },
        projectRef,
        bucketId,
      })
    )

    expect(url.searchParams.get('path')).toBe('avatars/2024')
    expect(url.searchParams.get('preview')).toBe('photo.png')
  })

  it('omits path at the bucket root', () => {
    const url = new URL(
      getStorageExplorerUrlForItem({
        openedFolders: [],
        item: { ...makeFile('photo.png'), columnIndex: 0 },
        projectRef,
        bucketId,
      })
    )

    expect(url.searchParams.get('path')).toBeNull()
    expect(url.searchParams.get('preview')).toBe('photo.png')
  })

  it('escapes a bucket id that needs encoding', () => {
    const url = new URL(
      getStorageExplorerUrlForItem({
        openedFolders: [],
        item: { ...makeFolder('a'), columnIndex: 0 },
        projectRef,
        bucketId: 'a b/c',
      })
    )

    expect(url.pathname).toContain('a%20b%2Fc')
  })
})

describe('clipboard helpers', () => {
  beforeEach(() => {
    vi.mocked(copyToClipboard).mockClear()
    vi.mocked(toast.success).mockClear()
  })

  it('announces a copied relative path only once the write has landed', () => {
    copyStoragePath([makeFolder('images')], { ...makeFile('photo.png'), columnIndex: 1 })

    const [text, onCopied] = vi.mocked(copyToClipboard).mock.calls[0]
    expect(text).toBe('images/photo.png')
    // The write is async and reports its own failure, so nothing is claimed up front
    expect(toast.success).not.toHaveBeenCalled()

    onCopied?.()
    expect(toast.success).toHaveBeenCalledWith('Copied relative path for "photo.png"')
  })

  it('announces a copied URL only once the write has landed', () => {
    copyStorageExplorerUrl({
      openedFolders: [],
      item: { ...makeFile('photo.png'), columnIndex: 0 },
      projectRef: 'abcdefghijklmnopqrst',
      bucketId: 'my-bucket',
    })

    const [text, onCopied] = vi.mocked(copyToClipboard).mock.calls[0]
    expect(text).toContain('preview=photo.png')
    expect(toast.success).not.toHaveBeenCalled()

    onCopied?.()
    expect(toast.success).toHaveBeenCalledWith('Copied URL for "photo.png"')
  })
})
