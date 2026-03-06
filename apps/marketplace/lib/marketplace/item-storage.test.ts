import { describe, expect, it } from 'vitest'

import {
  getItemFilesStoragePath,
  getItemTemplateRegistryFilePath,
  getItemTemplateStoragePath,
  MARKETPLACE_DRAFT_STORAGE_BUCKET,
  MARKETPLACE_PUBLIC_STORAGE_BUCKET,
} from './item-storage'

describe('item storage helpers', () => {
  it('uses separate draft and public buckets', () => {
    expect(MARKETPLACE_DRAFT_STORAGE_BUCKET).toBe('item_files')
    expect(MARKETPLACE_PUBLIC_STORAGE_BUCKET).toBe('public_item_files')
  })

  it('builds stable storage paths for item files and template packages', () => {
    expect(getItemFilesStoragePath(1, 2)).toBe('1/items/2/files')
    expect(getItemTemplateStoragePath(1, 2)).toBe('1/items/2/template')
    expect(getItemTemplateRegistryFilePath(1, 2)).toBe('1/items/2/template/template.json')
  })
})
