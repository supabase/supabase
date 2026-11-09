import { describe, expect, it } from 'vitest'

import type { UploadConflicts } from './StorageExplorer.utils'
import { getUploadConflictCopy } from './UploadConflictModal.utils'

const copyFor = (conflicts: Partial<UploadConflicts>) =>
  getUploadConflictCopy({
    liveNames: [],
    archivedNames: [],
    isVersioningSuspended: false,
    ...conflicts,
  })

describe('getUploadConflictCopy', () => {
  it('names the single live file and offers a replace', () => {
    const copy = copyFor({ liveNames: ['photo.png'] })

    expect(copy.title).toBe('photo.png already exists here')
    expect(copy.replaceLabel).toBe('Replace existing file')
    expect(copy.keepBothLabel).toBe('Keep both files')
  })

  it('counts several live files instead of naming them', () => {
    const copy = copyFor({
      liveNames: ['photo.png', 'notes.txt'],
    })

    expect(copy.title).toBe('2 files already exist here')
    expect(copy.replaceLabel).toBe('Replace existing files')
    expect(copy.keepBothLabel).toBe('Keep all files')
  })

  it('calls a single archived clash a restore, not a replace', () => {
    const copy = copyFor({ archivedNames: ['icon-1.svg'] })

    expect(copy.title).toBe('icon-1.svg already exists and is archived')
    expect(copy.replaceLabel).toBe('Restore and add a new version')
    expect(copy.keepBothDescription).toContain('Leaves the file archived')
  })

  it('counts several archived clashes', () => {
    const copy = copyFor({
      archivedNames: ['icon-1.svg', 'icon-2.svg'],
    })

    expect(copy.title).toBe('2 files already exist and are archived')
    expect(copy.replaceLabel).toBe('Restore and add new versions')
  })

  describe('suspended versioning', () => {
    it('promises the retention once, then an overwrite', () => {
      const copy = copyFor({ liveNames: ['photo.png'], isVersioningSuspended: true })

      expect(copy.replaceLabel).toBe('Replace existing file')
      expect(copy.replaceDescription).toContain('kept as a noncurrent version one last time')
      expect(copy.replaceDescription).toContain('overwrites it in place')
    })

    it('says the same for several files', () => {
      const copy = copyFor({
        liveNames: ['photo.png', 'notes.txt'],
        isVersioningSuspended: true,
      })

      expect(copy.replaceDescription).toContain('Each file you replace is kept')
      expect(copy.replaceDescription).toContain('one last time')
    })

    it('keeps the restore wording for an archived clash, which suspension does not change', () => {
      const copy = copyFor({ archivedNames: ['icon-1.svg'], isVersioningSuspended: true })

      expect(copy.replaceLabel).toBe('Restore and add a new version')
    })

    it('keeps the one-shot qualifier in the mixed case', () => {
      const copy = copyFor({
        liveNames: ['photo.png'],
        archivedNames: ['icon-1.svg'],
        isVersioningSuspended: true,
      })

      expect(copy.replaceDescription).toContain('archived files are restored')
      expect(copy.replaceDescription).toContain('one last time')
    })
  })

  it('covers both effects when the clash is mixed', () => {
    const copy = copyFor({
      liveNames: ['photo.png'],
      archivedNames: ['icon-1.svg'],
    })

    expect(copy.title).toBe('2 files already exist here')
    expect(copy.description).toContain('Some of them are archived')
    expect(copy.replaceLabel).toBe('Replace and restore')
    expect(copy.replaceDescription).toContain('noncurrent versions')
    expect(copy.replaceDescription).toContain('restored')
  })
})
