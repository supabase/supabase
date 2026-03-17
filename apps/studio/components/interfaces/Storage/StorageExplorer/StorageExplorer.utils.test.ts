import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import type { StorageItem } from '@/components/interfaces/Storage/Storage.types'
import {
  getPathAlongFoldersToIndex,
  getPathAlongOpenedFolders,
  sanitizeNameForDuplicateInColumn,
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

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

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
