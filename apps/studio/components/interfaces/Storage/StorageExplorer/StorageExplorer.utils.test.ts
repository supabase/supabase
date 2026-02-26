import { describe, expect, it } from 'vitest'

import { validateFolderName } from '@/components/interfaces/Storage/StorageExplorer/StorageExplorer.utils'

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
