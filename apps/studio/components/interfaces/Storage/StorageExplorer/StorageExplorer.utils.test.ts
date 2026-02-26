import { describe, expect, it } from 'vitest'

import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import type { StorageItem } from '@/components/interfaces/Storage/Storage.types'
import {
  getPathAlongFoldersToIndex,
  getPathAlongOpenedFolders,
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
